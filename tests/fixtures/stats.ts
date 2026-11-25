import type { GitHubStats } from '@/domain/models';

export const sampleStats: GitHubStats = {
  login: 'octocat',
  name: 'The Octocat',
  totalStars: 12_480,
  totalCommits: 1_342,
  totalPRs: 218,
  totalIssues: 96,
  contributedTo: 41,
  followers: 3_900,
  rank: { level: 'A+', percentile: 8.4 },
};
