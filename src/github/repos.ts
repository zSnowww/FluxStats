import type { AppError } from '@/domain/AppError';
import type { RepoSummary, UserRepos } from '@/domain/models';
import type { Result } from '@/domain/Result';
import { TtlCache, cached } from '@/lib/cache';
import { queryUser } from '@/github/graphql';

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      repositories(
        first: 30
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          name
          description
          stargazerCount
          forkCount
          isArchived
          primaryLanguage {
            name
            color
          }
        }
      }
    }
  }
`;

interface ReposUser {
  login: string;
  repositories: {
    nodes: Array<{
      name: string;
      description: string | null;
      stargazerCount: number;
      forkCount: number;
      isArchived: boolean;
      primaryLanguage: { name: string; color: string | null } | null;
    } | null>;
  };
}

const cache = new TtlCache<UserRepos>(60 * 60 * 1000);

export const fetchRepos = (username: string): Promise<Result<UserRepos, AppError>> =>
  cached(cache, username.toLowerCase(), async () =>
    (await queryUser<ReposUser>(QUERY, username)).map((user) => ({
      login: user.login,
      repos: user.repositories.nodes
        .flatMap((r) => (r ? [r] : []))
        .map((r) => ({
          name: r.name,
          description: r.description,
          stars: r.stargazerCount,
          forks: r.forkCount,
          language: r.primaryLanguage,
          isArchived: r.isArchived,
        })),
    })),
  );

/**
 * The `count` repos with the most stars, minus the excluded ones
 * (case-insensitive) and, if requested, archived ones. The profile repo
 * (`user/user`) is always skipped: it is the README that holds the card.
 */
export function selectTopRepos(
  data: UserRepos,
  count: number,
  exclude: string[] = [],
  hideArchived = false,
): RepoSummary[] {
  const excluded = new Set([...exclude, data.login].map((e) => e.toLowerCase()));
  return data.repos
    .filter((r) => !excluded.has(r.name.toLowerCase()) && !(hideArchived && r.isArchived))
    .slice(0, count);
}
