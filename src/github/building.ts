import type { AppError } from '@/domain/AppError';
import type { CurrentBuilding } from '@/domain/models';
import { failure, success, type Result } from '@/domain/Result';
import { cached, TtlCache } from '@/lib/cache';
import { queryUser } from '@/github/graphql';
import { fetchPublicCalendar } from '@/github/public-calendar';

interface BuildingUser {
  login: string;
  contributionsCollection: {
    contributionCalendar: { totalContributions: number };
    commitContributionsByRepository: Array<{
      repository: {
        nameWithOwner: string;
        isPrivate: boolean;
        description: string | null;
        primaryLanguage: { name: string; color: string | null } | null;
      } | null;
      contributions: { totalCount: number };
    }>;
  };
}

const cache = new TtlCache<CurrentBuilding>(60 * 60 * 1000);

/** The 30 UTC days ending today, including the current day. */
export const fetchCurrentlyBuilding = (
  username: string,
): Promise<Result<CurrentBuilding, AppError>> =>
  cached(cache, username.toLowerCase(), async () => {
    const now = new Date();
    const start = new Date(now);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 29);
    const from = start.toISOString().slice(0, 10);
    const to = now.toISOString().slice(0, 10);
    const result = await queryUser<BuildingUser>(
      /* GraphQL */ `
      query ($login: String!) {
        user(login: $login) {
          login
          contributionsCollection(from: "${start.toISOString()}", to: "${now.toISOString()}") {
            contributionCalendar { totalContributions }
            commitContributionsByRepository(maxRepositories: 100) {
              repository { nameWithOwner isPrivate description primaryLanguage { name color } }
              contributions { totalCount }
            }
          }
        }
      }
    `,
      username,
    );
    if (result.isFailure) return failure(result.error);
    const user = result.value;
    // Reuses the yearly calendar: avoids one HTML request per card.
    const calendar = await fetchPublicCalendar(user.login);
    const publicTotal = calendar.isSuccess
      ? calendar.value
          .filter((d) => d.date >= from && d.date <= to)
          .reduce((sum, d) => sum + d.count, 0)
      : 0;
    const repos = user.contributionsCollection.commitContributionsByRepository
      .flatMap(({ repository, contributions }) =>
        repository && !repository.isPrivate && contributions.totalCount > 0
          ? [
              {
                name: repository.nameWithOwner,
                commits: contributions.totalCount,
                description: repository.description,
                language: repository.primaryLanguage,
              },
            ]
          : [],
      )
      .sort((a, b) => b.commits - a.commits || a.name.localeCompare(b.name));
    return success({
      login: user.login,
      from,
      to,
      total: Math.max(
        publicTotal,
        user.contributionsCollection.contributionCalendar.totalContributions,
      ),
      repos,
    });
  });
