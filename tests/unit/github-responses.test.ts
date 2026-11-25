import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { app } from '@/app';
import { fetchGitHubStats } from '@/github/stats';

/** Fake GraphQL response: what GitHub returns with a read-only token. */
function mockGraphQL(user: unknown) {
  const fake = async () => Response.json({ data: { user } });
  return spyOn(globalThis, 'fetch').mockImplementation(fake as unknown as typeof fetch);
}

const statsUser = {
  login: 'octocat',
  name: null,
  followers: { totalCount: 3 },
  contributionsCollection: { totalCommitContributions: 10, restrictedContributionsCount: 0 },
  pullRequests: { totalCount: 1 },
  issues: { totalCount: 2 },
  repositoriesContributedTo: { totalCount: 0 },
  // Repos the token cannot see arrive as null.
  repositories: { nodes: [null, { stargazers: { totalCount: 5 } }, null] },
};

describe('GitHub responses with inaccessible repos', () => {
  const token = process.env.GITHUB_TOKEN;
  beforeEach(() => {
    process.env.GITHUB_TOKEN = 'test-token';
  });
  afterEach(() => {
    process.env.GITHUB_TOKEN = token;
  });

  it('stats ignore null repository nodes', async () => {
    const spy = mockGraphQL(statsUser);
    const result = await fetchGitHubStats(`null-nodes-${Date.now()}`);
    spy.mockRestore();
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.totalStars).toBe(5);
      expect(result.value.name).toBe('octocat');
    }
  });

  it('an unexpected error becomes an SVG error card, not a 500', async () => {
    const spy = mockGraphQL({ login: 'octocat' }); // unexpected shape: missing fields
    const res = await app.request(`/api/github/stats?username=broken-${Date.now()}`);
    spy.mockRestore();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    expect(await res.text()).toContain('Something went wrong');
  });
});
