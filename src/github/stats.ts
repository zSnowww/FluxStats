import type { AppError } from '@/domain/AppError';
import type { GitHubStats } from '@/domain/models';
import type { Result } from '@/domain/Result';
import { TtlCache, cached } from '@/lib/cache';
import { queryUser } from '@/github/graphql';
import { calculateRank } from '@/github/rank';

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      name
      followers {
        totalCount
      }
      contributionsCollection {
        totalCommitContributions
        restrictedContributionsCount
      }
      pullRequests {
        totalCount
      }
      issues {
        totalCount
      }
      repositoriesContributedTo(
        first: 1
        contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]
      ) {
        totalCount
      }
      repositories(
        first: 100
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
        orderBy: { field: STARGAZERS, direction: DESC }
      ) {
        nodes {
          stargazers {
            totalCount
          }
        }
      }
    }
  }
`;

interface StatsUser {
  login: string;
  name: string | null;
  followers: { totalCount: number };
  contributionsCollection: {
    totalCommitContributions: number;
    restrictedContributionsCount: number;
  };
  pullRequests: { totalCount: number };
  issues: { totalCount: number };
  repositoriesContributedTo: { totalCount: number };
  // GitHub returns `null` in place of repos the token cannot see.
  repositories: { nodes: Array<{ stargazers: { totalCount: number } } | null> };
}

const cache = new TtlCache<GitHubStats>(30 * 60 * 1000);

export const fetchGitHubStats = (username: string): Promise<Result<GitHubStats, AppError>> =>
  cached(cache, username.toLowerCase(), async () =>
    (await queryUser<StatsUser>(QUERY, username)).map(toStats),
  );

function toStats(user: StatsUser): GitHubStats {
  const c = user.contributionsCollection;
  const raw = {
    commits: c.totalCommitContributions + c.restrictedContributionsCount,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    stars: user.repositories.nodes.reduce((acc, r) => acc + (r?.stargazers.totalCount ?? 0), 0),
    followers: user.followers.totalCount,
  };
  return {
    login: user.login,
    name: user.name || user.login,
    totalStars: raw.stars,
    totalCommits: raw.commits,
    totalPRs: raw.prs,
    totalIssues: raw.issues,
    contributedTo: user.repositoriesContributedTo.totalCount,
    followers: raw.followers,
    rank: calculateRank(raw),
  };
}
