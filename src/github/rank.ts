import type { Rank } from '@/domain/models';

interface RankInput {
  commits: number;
  prs: number;
  issues: number;
  stars: number;
  followers: number;
}

// Each metric is normalized against an approximate GitHub user median and
// weighted. The result is an estimated percentile (lower = better).
const WEIGHTS = {
  commits: { median: 250, weight: 2 },
  prs: { median: 50, weight: 3 },
  issues: { median: 25, weight: 1 },
  stars: { median: 50, weight: 4 },
  followers: { median: 10, weight: 1 },
} as const;

const LEVELS: Array<[threshold: number, level: string]> = [
  [1, 'S'],
  [12.5, 'A+'],
  [25, 'A'],
  [37.5, 'A-'],
  [50, 'B+'],
  [62.5, 'B'],
  [75, 'B-'],
  [87.5, 'C+'],
  [100, 'C'],
];

const exponentialCdf = (x: number) => 1 - 2 ** -x;
const logNormalCdf = (x: number) => x / (1 + x);

export function calculateRank(input: RankInput): Rank {
  const total = Object.values(WEIGHTS).reduce((acc, w) => acc + w.weight, 0);
  const score =
    WEIGHTS.commits.weight * exponentialCdf(input.commits / WEIGHTS.commits.median) +
    WEIGHTS.prs.weight * exponentialCdf(input.prs / WEIGHTS.prs.median) +
    WEIGHTS.issues.weight * exponentialCdf(input.issues / WEIGHTS.issues.median) +
    WEIGHTS.stars.weight * logNormalCdf(input.stars / WEIGHTS.stars.median) +
    WEIGHTS.followers.weight * logNormalCdf(input.followers / WEIGHTS.followers.median);

  const percentile = (1 - score / total) * 100;
  const level = LEVELS.find(([t]) => percentile <= t)?.[1] ?? 'C';
  return { level, percentile };
}
