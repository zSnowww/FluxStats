import { describe, expect, it } from 'bun:test';
import { GitHubStatsQuerySchema } from '@/domain/StatsSchema';

describe('GitHubStatsQuerySchema', () => {
  it('applies defaults', () => {
    const q = GitHubStatsQuerySchema.parse({ username: 'octocat' });
    expect(q.theme).toBe('graphite');
    expect(q.show_icons).toBe(true);
    expect(q.hide_border).toBe(false);
  });

  it('parses "false" as false (z.coerce.boolean would not)', () => {
    const q = GitHubStatsQuerySchema.parse({ username: 'octocat', show_icons: 'false' });
    expect(q.show_icons).toBe(false);
  });

  it('normalises hex colors without #', () => {
    const q = GitHubStatsQuerySchema.parse({ username: 'octocat', bg_color: '0d1117' });
    expect(q.bg_color).toBe('#0d1117');
  });

  it('rejects invalid usernames and themes', () => {
    expect(GitHubStatsQuerySchema.safeParse({ username: '<script>' }).success).toBe(false);
    expect(GitHubStatsQuerySchema.safeParse({ username: 'a', theme: 'nope' }).success).toBe(false);
  });
});
