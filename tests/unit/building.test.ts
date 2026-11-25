import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { app } from '@/app';

let spy: ReturnType<typeof spyOn>;
const token = process.env.GITHUB_TOKEN;
beforeEach(() => {
  process.env.GITHUB_TOKEN = 'test-token';
});
afterEach(() => {
  spy?.mockRestore();
  if (token === undefined) delete process.env.GITHUB_TOKEN;
  else process.env.GITHUB_TOKEN = token;
});

function responses(
  login: string,
  options: { empty?: boolean; unavailable?: boolean; lowTotal?: boolean } = {},
) {
  spy = spyOn(globalThis, 'fetch').mockImplementation((async (
    input: unknown,
    init?: RequestInit,
  ) => {
    const url = String(input);
    if (!url.includes('api.github.com')) {
      if (options.unavailable) return new Response('changed markup');
      const today = new Date().toISOString().slice(0, 10);
      return new Response(
        `<td class="ContributionCalendar-day" data-date="${today}" id="d" data-level="3"></td><tool-tip for="d">${options.empty ? 0 : options.lowTotal ? 1 : 50} contributions on November 20.</tool-tip>`,
      );
    }
    const query = JSON.parse(String(init?.body)).query;
    const from = query.match(/from: "([^"]+)"/)?.[1];
    expect(from).toBeDefined();
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - 29);
    expect(from).toBe(start.toISOString());
    const repo = (nameWithOwner: string, count: number, isPrivate = false) => ({
      repository: {
        nameWithOwner,
        isPrivate,
        description: 'A project',
        primaryLanguage: { name: 'TypeScript', color: '#3178c6' },
      },
      contributions: { totalCount: count },
    });
    return Response.json({
      data: {
        user: {
          login,
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: options.empty ? 0 : options.lowTotal ? 1 : 30,
            },
            commitContributionsByRepository: options.empty
              ? []
              : [
                  repo('me/small', 3),
                  repo('secret/hidden-project', 15, true),
                  { repository: null, contributions: { totalCount: 2 } },
                  repo('me/big', 10),
                  repo('me/zero', 0),
                ],
          },
        },
      },
    });
  }) as typeof fetch);
}

async function card(login: string, query = '') {
  const response = await app.request(
    `/api/github/building?username=${login}&animate=false${query}`,
  );
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('image/svg+xml');
  return response.text();
}

describe('Currently building card', () => {
  it('ranks public repos by commits and accounts for all remaining work anonymously', async () => {
    responses('building-main');
    const svg = await card('building-main', '&repos_count=1');
    expect(svg).toContain('Currently building');
    expect(svg).toContain('Last 30 days');
    expect(svg).toContain('me/big');
    expect(svg).toContain('10 commits');
    expect(svg).toContain('40 contributions');
    expect(svg).toContain('Private &amp; other work');
    expect(svg).not.toContain('hidden-project');
    expect(svg).not.toContain('me/small');
    expect(svg).not.toContain('me/zero');
  });
  it('sorts descending', async () => {
    responses('building-sorted');
    const svg = await card('building-sorted');
    expect(svg.indexOf('me/big')).toBeLessThan(svg.indexOf('me/small'));
    expect(svg).toContain('37 contributions');
  });
  it('falls back to API totals when the public calendar is unavailable', async () => {
    responses('building-fallback', { unavailable: true });
    expect(await card('building-fallback')).toContain('17 contributions');
  });
  it('never displays negative remainder when snapshots disagree', async () => {
    responses('building-low', { lowTotal: true });
    expect(await card('building-low')).toContain('0 contributions');
  });
  it('handles no recent activity', async () => {
    responses('building-empty', { empty: true });
    const svg = await card('building-empty');
    expect(svg).toContain('No public commits in this period');
    expect(svg).toContain('0 contributions');
  });
  it('validates repository count and username', async () => {
    expect(await card('building-invalid', '&repos_count=11')).toContain('repos_count');
    const response = await app.request('/api/github/building?username=%3Cbad%3E');
    expect(await response.text()).toContain('Invalid GitHub username');
  });
});
