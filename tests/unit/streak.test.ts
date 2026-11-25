import { describe, expect, it } from 'bun:test';
import type { ContributionDay } from '@/domain/models';
import { calculateStreak } from '@/github/streak';

/** Consecutive days from January 1 built from daily counts. */
function days(counts: number[]): ContributionDay[] {
  return counts.map((count, i) => {
    const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
    return { date, weekday: i % 7, count, level: (count ? 1 : 0) as 0 | 1 };
  });
}

describe('calculateStreak', () => {
  it('finds current and longest streaks', () => {
    const s = calculateStreak(days([1, 1, 1, 0, 2, 0, 1, 1]));
    expect(s.longest).toEqual({ length: 3, start: '2026-01-01', end: '2026-01-03' });
    expect(s.current).toEqual({ length: 2, start: '2026-01-07', end: '2026-01-08' });
  });

  it('does not break the current streak because today is still empty', () => {
    const s = calculateStreak(days([0, 1, 1, 1, 0]));
    expect(s.current.length).toBe(3);
    expect(s.current.end).toBe('2026-01-04');
  });

  it('breaks the current streak after a full empty day', () => {
    expect(calculateStreak(days([1, 1, 0, 0])).current.length).toBe(0);
  });

  it('handles a year without contributions', () => {
    const s = calculateStreak(days([0, 0, 0]));
    expect(s.current).toEqual({ length: 0, start: null, end: null });
    expect(s.longest.length).toBe(0);
  });
});
