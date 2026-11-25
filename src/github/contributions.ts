import type { AppError } from '@/domain/AppError';
import type { ContributionCalendar, ContributionDay, ContributionHistory } from '@/domain/models';
import { failure, type Result } from '@/domain/Result';
import { TtlCache, cached } from '@/lib/cache';
import { queryUser } from '@/github/graphql';
import { fetchPublicCalendar, withPublicCounts } from '@/github/public-calendar';

const QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              weekday
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

type Level = 'NONE' | 'FIRST_QUARTILE' | 'SECOND_QUARTILE' | 'THIRD_QUARTILE' | 'FOURTH_QUARTILE';

interface CalendarUser {
  login: string;
  contributionsCollection: {
    contributionCalendar: {
      totalContributions: number;
      weeks: Array<{
        contributionDays: Array<{
          date: string;
          weekday: number;
          contributionCount: number;
          contributionLevel: Level;
        }>;
      }>;
    };
  };
}

const LEVELS: Record<Level, ContributionDay['level']> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

const cache = new TtlCache<ContributionCalendar>(30 * 60 * 1000);

export const fetchContributions = (
  username: string,
): Promise<Result<ContributionCalendar, AppError>> =>
  cached(cache, username.toLowerCase(), async () => {
    const result = await queryUser<CalendarUser>(QUERY, username);
    if (result.isFailure) return failure(result.error);
    const publicResult = await fetchPublicCalendar(result.value.login);
    return result.map((user) => {
      const cal = user.contributionsCollection.contributionCalendar;
      const weeks = cal.weeks.map((w) =>
        withPublicCounts(
          w.contributionDays.map((d) => ({
            date: d.date,
            weekday: d.weekday,
            count: d.contributionCount,
            level: LEVELS[d.contributionLevel],
          })),
          publicResult.isSuccess ? publicResult.value : [],
        ),
      );
      return {
        login: user.login,
        total: Math.max(
          cal.totalContributions,
          weeks.flat().reduce((sum, d) => sum + d.count, 0),
        ),
        weeks,
      };
    });
  });

// ── Full history ──
// GitHub limits each contributionsCollection to one year, so every year is
// requested in a single query using one alias per year.

const YEARS_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      login
      contributionsCollection {
        contributionYears
      }
    }
  }
`;

interface YearsUser {
  login: string;
  contributionsCollection: { contributionYears: number[] };
}

type DayNode =
  CalendarUser['contributionsCollection']['contributionCalendar']['weeks'][number]['contributionDays'][number];

interface HistoryUser {
  login: string;
  [alias: `y${number}`]: {
    contributionCalendar: { weeks: Array<{ contributionDays: DayNode[] }> };
  };
}

export function historyQuery(years: number[], now = new Date()): string {
  const thisYear = now.getUTCFullYear();
  const blocks = years.map((year) => {
    const from = `${year}-01-01T00:00:00Z`;
    // The current year ends "now": no empty future days that would break the streak.
    const to = year === thisYear ? now.toISOString() : `${year}-12-31T23:59:59Z`;
    return `y${year}: contributionsCollection(from: "${from}", to: "${to}") {
        contributionCalendar { weeks { contributionDays { date weekday contributionCount contributionLevel } } }
      }`;
  });
  return `query ($login: String!) { user(login: $login) { login ${blocks.join('\n')} } }`;
}

const historyCache = new TtlCache<ContributionHistory>(60 * 60 * 1000);

export const fetchContributionHistory = (
  username: string,
): Promise<Result<ContributionHistory, AppError>> =>
  cached(historyCache, username.toLowerCase(), async () => {
    const yearsResult = await queryUser<YearsUser>(YEARS_QUERY, username);
    if (yearsResult.isFailure) return failure(yearsResult.error);
    const years = [...yearsResult.value.contributionsCollection.contributionYears].sort();

    const today = new Date().toISOString().slice(0, 10);
    const result = await queryUser<HistoryUser>(historyQuery(years), username);
    if (result.isFailure) return failure(result.error);
    const publicDays: ContributionDay[] = [];
    // Limits to four concurrent requests for profiles with many years.
    for (let i = 0; i < years.length; i += 4) {
      const calendars = await Promise.all(
        years.slice(i, i + 4).map((year) =>
          fetchPublicCalendar(result.value.login, {
            from: `${year}-01-01`,
            to: year === new Date().getUTCFullYear() ? today : `${year}-12-31`,
          }),
        ),
      );
      for (const calendar of calendars) if (calendar.isSuccess) publicDays.push(...calendar.value);
    }
    return result.map((user) => {
      // A Map by date: weeks at the edge of each year can repeat.
      const byDate = new Map<string, ContributionDay>();
      for (const year of years) {
        for (const week of user[`y${year}`]?.contributionCalendar.weeks ?? []) {
          for (const d of week.contributionDays) {
            if (d.date > today) continue;
            byDate.set(d.date, {
              date: d.date,
              weekday: d.weekday,
              count: d.contributionCount,
              level: LEVELS[d.contributionLevel],
            });
          }
        }
      }
      const days = withPublicCounts(
        [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
        publicDays,
      );
      return {
        login: user.login,
        firstYear: years[0] ?? new Date().getUTCFullYear(),
        total: days.reduce((acc, d) => acc + d.count, 0),
        days,
      };
    });
  });
