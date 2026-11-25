import { describe, expect, it } from 'bun:test';
import { calculateRank } from '@/github/rank';

describe('calculateRank', () => {
  it('gives C to an empty profile', () => {
    expect(calculateRank({ commits: 0, prs: 0, issues: 0, stars: 0, followers: 0 }).level).toBe(
      'C',
    );
  });

  it('gives S to a very active profile', () => {
    const r = calculateRank({
      commits: 5000,
      prs: 2000,
      issues: 800,
      stars: 100_000,
      followers: 20_000,
    });
    expect(r.level).toBe('S');
    expect(r.percentile).toBeLessThanOrEqual(1);
  });

  it('is monotonic', () => {
    const low = calculateRank({ commits: 100, prs: 10, issues: 5, stars: 10, followers: 5 });
    const high = calculateRank({ commits: 500, prs: 80, issues: 30, stars: 200, followers: 50 });
    expect(high.percentile).toBeLessThan(low.percentile);
  });
});
