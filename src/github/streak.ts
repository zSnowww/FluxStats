import type { ContributionDay, GitHubStreak, StreakRange } from '@/domain/models';

const EMPTY: StreakRange = { length: 0, start: null, end: null };

/**
 * Current and longest streak from days in chronological order.
 * Like GitHub, if today (the last day) has no contributions yet, the current
 * streak is not broken: the day is not over.
 */
export function calculateStreak(days: ContributionDay[]): GitHubStreak {
  let longest = EMPTY;
  let run: StreakRange = EMPTY;
  for (const day of days) {
    if (day.count > 0) {
      run = { length: run.length + 1, start: run.start ?? day.date, end: day.date };
      if (run.length > longest.length) longest = run;
    } else {
      run = EMPTY;
    }
  }

  let current = EMPTY;
  let i = days.length - 1;
  if (days[i] && days[i]!.count === 0) i--;
  for (; i >= 0 && days[i]!.count > 0; i--) {
    const date = days[i]!.date;
    current = { length: current.length + 1, start: date, end: current.end ?? date };
  }

  return { current, longest };
}
