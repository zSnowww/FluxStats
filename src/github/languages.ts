import type { AppError } from '@/domain/AppError';
import type { LanguageShare, LanguageStat, UserLanguages } from '@/domain/models';
import type { Result } from '@/domain/Result';
import { TtlCache, cached } from '@/lib/cache';
import { queryUser } from '@/github/graphql';

// Public repos only: with the user's own token, OWNER would include private
// ones and the card would leak what they work on in private.
const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      repositories(first: 100, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC) {
        nodes {
          languages(first: 10, orderBy: { field: SIZE, direction: DESC }) {
            edges {
              size
              node {
                name
                color
              }
            }
          }
        }
      }
    }
  }
`;

interface LanguagesUser {
  login: string;
  repositories: {
    nodes: Array<{
      languages: { edges: Array<{ size: number; node: { name: string; color: string | null } }> };
    } | null>;
  };
}

const cache = new TtlCache<UserLanguages>(60 * 60 * 1000);

export const fetchLanguages = (username: string): Promise<Result<UserLanguages, AppError>> =>
  cached(cache, username.toLowerCase(), async () =>
    (await queryUser<LanguagesUser>(QUERY, username)).map(toLanguages),
  );

function toLanguages(user: LanguagesUser): UserLanguages {
  const byName = new Map<string, LanguageStat>();
  for (const repo of user.repositories.nodes) {
    for (const { size, node } of repo?.languages.edges ?? []) {
      const prev = byName.get(node.name);
      if (prev) prev.bytes += size;
      else byName.set(node.name, { name: node.name, color: node.color, bytes: size });
    }
  }
  return { login: user.login, languages: [...byName.values()].sort((a, b) => b.bytes - a.bytes) };
}

/**
 * Top N languages by size, minus the hidden ones. The rest is grouped into
 * "Other" to avoid inventing colors or growing the card without limit.
 */
export function selectTopLanguages(
  languages: LanguageStat[],
  count: number,
  hide: string[] = [],
): LanguageShare[] {
  const hidden = new Set(hide.map((h) => h.toLowerCase()));
  const visible = languages
    .filter((l) => !hidden.has(l.name.toLowerCase()))
    .sort((a, b) => b.bytes - a.bytes);
  const total = visible.reduce((acc, l) => acc + l.bytes, 0);
  if (total === 0) return [];

  const top: LanguageShare[] = visible
    .slice(0, count)
    .map((l) => ({ ...l, share: l.bytes / total, isOther: false }));
  const restBytes = visible.slice(count).reduce((acc, l) => acc + l.bytes, 0);
  if (restBytes > 0) {
    top.push({
      name: 'Other',
      color: null,
      bytes: restBytes,
      share: restBytes / total,
      isOther: true,
    });
  }
  return top;
}
