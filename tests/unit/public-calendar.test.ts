import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import {
  fetchPublicCalendar,
  parsePublicCalendar,
  withPublicCounts,
} from '@/github/public-calendar';
import { fetchContributions, fetchContributionHistory } from '@/github/contributions';
import { calculateStreak } from '@/github/streak';

const calendarHtml = (entries: Array<[string, number]>) =>
  entries
    .map(
      ([date, count], i) =>
        `<td class="ContributionCalendar-day" id="day-${i}" data-date="${date}" data-level="${count ? 3 : 0}"></td><tool-tip for="day-${i}">${count ? `${count.toLocaleString('en-US')} contribution${count === 1 ? '' : 's'}` : 'No contributions'} on November 1.</tool-tip>`,
    )
    .join('');

const apiDay = (date: string, count: number) => ({
  date,
  weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
  contributionCount: count,
  contributionLevel: count ? 'FIRST_QUARTILE' : 'NONE',
});
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
const fakeFetch = (fn: (url: string, init?: RequestInit) => Promise<Response>) => {
  spy = spyOn(globalThis, 'fetch').mockImplementation(((url: unknown, init?: RequestInit) =>
    fn(String(url), init)) as typeof fetch);
};

describe('public calendar reader', () => {
  it('joins tooltips by id, reads exact counts, and sorts days', () => {
    const days = parsePublicCalendar(
      calendarHtml([
        ['2026-11-03', 1234],
        ['2026-11-01', 0],
        ['2026-11-02', 1],
      ]),
    );
    expect(days.map((d) => d.count)).toEqual([0, 1, 1234]);
    expect(days.map((d) => d.weekday)).toEqual([0, 1, 2]);
  });
  it('rejects partially unreadable calendars instead of trusting partial totals', () => {
    expect(
      parsePublicCalendar(
        calendarHtml([
          ['2026-11-01', 2],
          ['2026-11-02', 3],
        ]).replace('3 contributions', 'Changed markup'),
      ),
    ).toEqual([]);
  });
  it('rejects invalid dates and levels', () => {
    for (const html of [
      calendarHtml([['2026-02-30', 2]]),
      calendarHtml([['2026-11-01', 2]]).replace('data-level="3"', 'data-level="1.5"'),
      calendarHtml([['2026-11-01', 2]]).replace('data-level="3"', ''),
    ])
      expect(parsePublicCalendar(html)).toEqual([]);
  });
  it('preserves API counts and missing days without mutating input', () => {
    const days = parsePublicCalendar(
      calendarHtml([
        ['2026-11-01', 3],
        ['2026-11-02', 5],
        ['2026-11-03', 2],
      ]),
    );
    const merged = withPublicCounts(
      days,
      parsePublicCalendar(
        calendarHtml([
          ['2026-11-01', 8],
          ['2026-11-02', 1],
        ]),
      ),
    );
    expect(merged.map((d) => d.count)).toEqual([8, 5, 2]);
    expect(days.map((d) => d.count)).toEqual([3, 5, 2]);
  });
  it('shares successful requests for an hour, keeps ranges separate, and sends no token', async () => {
    const urls: string[] = [];
    fakeFetch(async (url, init) => {
      expect(new Headers(init?.headers).has('Authorization')).toBe(false);
      urls.push(url);
      return new Response(calendarHtml([['2026-11-01', 8]]));
    });
    const login = 'cache-public-calendar';
    await Promise.all([fetchPublicCalendar(login), fetchPublicCalendar(login.toUpperCase())]);
    await fetchPublicCalendar(login);
    await fetchPublicCalendar(login, { from: '2025-01-01', to: '2025-12-31' });
    expect(urls).toHaveLength(2);
    expect(urls[1]).toContain('from=2025-01-01&to=2025-12-31');
    const clock = spyOn(Date, 'now').mockReturnValue(Date.now() + 60 * 60 * 1000 + 1);
    try {
      await fetchPublicCalendar(login);
      expect(urls).toHaveLength(3);
    } finally {
      clock.mockRestore();
    }
  });
  it('reports HTTP, markup and network failures', async () => {
    for (const kind of ['http', 'markup', 'network']) {
      fakeFetch(async () => {
        if (kind === 'network') throw new Error('offline');
        return new Response('not a calendar', { status: kind === 'http' ? 503 : 200 });
      });
      expect((await fetchPublicCalendar(`failure-${kind}`)).isFailure).toBe(true);
      spy.mockRestore();
    }
  });
});

describe('calendar integration', () => {
  it('corrects the calendar total and streak using private days', async () => {
    fakeFetch(async (url) =>
      url.includes('api.github.com')
        ? Response.json({
            data: {
              user: {
                login: 'integrated',
                contributionsCollection: {
                  contributionCalendar: {
                    totalContributions: 2,
                    weeks: [
                      { contributionDays: [apiDay('2026-11-01', 2), apiDay('2026-11-02', 0)] },
                    ],
                  },
                },
              },
            },
          })
        : new Response(
            calendarHtml([
              ['2026-11-01', 7],
              ['2026-11-02', 3],
            ]),
          ),
    );
    const result = await fetchContributions('integrated-calendar');
    expect(result.isSuccess).toBe(true);
    if (result.isFailure) throw result.error;
    expect(result.value.total).toBe(10);
    expect(calculateStreak(result.value.weeks.flat()).longest.length).toBe(2);
  });
  it('keeps API values when public markup cannot be read', async () => {
    fakeFetch(async (url) =>
      url.includes('api.github.com')
        ? Response.json({
            data: {
              user: {
                login: 'fallback',
                contributionsCollection: {
                  contributionCalendar: {
                    totalContributions: 2,
                    weeks: [{ contributionDays: [apiDay('2026-11-01', 2)] }],
                  },
                },
              },
            },
          })
        : new Response('markup changed'),
    );
    const result = await fetchContributions('fallback-calendar');
    if (result.isFailure) throw result.error;
    expect(result.value.total).toBe(2);
  });
  it('merges historical years independently, deduplicates boundaries and falls back per year', async () => {
    fakeFetch(async (url, init) => {
      if (!url.includes('api.github.com'))
        return url.includes('from=2024')
          ? new Response(calendarHtml([['2024-12-31', 9]]))
          : new Response('unavailable', { status: 503 });
      const query = JSON.parse(String(init?.body)).query;
      return Response.json({
        data: {
          user: query.includes('contributionYears')
            ? { login: 'history', contributionsCollection: { contributionYears: [2025, 2024] } }
            : {
                login: 'history',
                y2024: {
                  contributionCalendar: {
                    weeks: [{ contributionDays: [apiDay('2024-12-31', 1)] }],
                  },
                },
                y2025: {
                  contributionCalendar: {
                    weeks: [
                      {
                        contributionDays: [
                          apiDay('2024-12-31', 1),
                          apiDay('2025-01-01', 2),
                          apiDay('2099-01-01', 99),
                        ],
                      },
                    ],
                  },
                },
              },
        },
      });
    });
    const result = await fetchContributionHistory('history-integration');
    if (result.isFailure) throw result.error;
    expect(result.value.total).toBe(11);
    expect(result.value.days.map((d) => d.count)).toEqual([9, 2]);
    expect(calculateStreak(result.value.days).longest.length).toBe(2);
  });
});
