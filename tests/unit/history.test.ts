import { describe, expect, it } from 'bun:test';
import { historyQuery } from '@/github/contributions';
import { renderStreakCard } from '@/cards/streak';
import { renderProfileCard } from '@/cards/profile';
import { selectTopLanguages } from '@/github/languages';
import { dateRange } from '@/lib/chart';
import { resolveTheme } from '@/themes';
import { sampleCalendar } from '@tests/fixtures/contributions';
import { sampleLanguages } from '@tests/fixtures/languages';
import { sampleStats } from '@tests/fixtures/stats';

const now = new Date('2026-11-19T15:00:00Z');

describe('historyQuery', () => {
  it('asks for one aliased collection per year, ending the current year now', () => {
    const q = historyQuery([2024, 2025, 2026], now);
    expect(q).toContain(
      'y2024: contributionsCollection(from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z")',
    );
    expect(q).toContain(
      'y2026: contributionsCollection(from: "2026-01-01T00:00:00Z", to: "2026-11-19T15:00:00.000Z")',
    );
  });
});

describe('dateRange', () => {
  it('adds the year only when it is not the current one', () => {
    expect(dateRange('2026-09-03', '2026-09-14', now)).toBe('Sep 3 – Sep 14');
    expect(dateRange('2025-12-28', '2026-01-04', now)).toBe('Dec 28, 2025 – Jan 4');
    expect(dateRange(null, null, now)).toBe('—');
  });
});

describe('streak and profile cards', () => {
  const cal = sampleCalendar();
  const theme = resolveTheme('graphite');

  it('streak card shows totals, both streaks and the last 30 days', () => {
    const days = cal.weeks.flat();
    const svg = renderStreakCard(
      { login: 'octocat', firstYear: 2025, total: cal.total, days },
      { theme, hideBorder: false, animate: true },
    );
    expect(svg).toContain('Total contributions');
    expect(svg).toContain('Longest streak');
    expect(svg).toContain('Last 30 days');
    expect((svg.match(/<\/rect>/g) ?? []).length).toBe(30);
  });

  it('profile card combines stats, languages and the streak strip', () => {
    const svg = renderProfileCard(
      { stats: sampleStats, languages: selectTopLanguages(sampleLanguages, 5), calendar: cal },
      { theme, palette: 'theme', showIcons: true, hideBorder: false, animate: true },
    );
    for (const text of [
      'Stars earned',
      'Top languages',
      'TypeScript',
      'Current streak',
      'Rank A+',
    ]) {
      expect(svg).toContain(text);
    }
  });
});
