import { describe, expect, it } from 'bun:test';
import { renderActivityCard, renderCalendarCard } from '@/cards/contributions';
import { monthTicks, niceMax, shortDate } from '@/lib/chart';
import { resolveTheme } from '@/themes';
import { sampleCalendar } from '@tests/fixtures/contributions';

const opts = { theme: resolveTheme('graphite'), hideBorder: false, animate: true };

describe('chart helpers', () => {
  it('rounds the axis maximum up to an even, readable number', () => {
    expect(niceMax(0)).toBe(4);
    expect(niceMax(37)).toBe(40);
    expect(niceMax(130)).toBe(150);
    expect(niceMax(224)).toBe(250);
    expect(niceMax(57)).toBe(60);
  });

  it('formats dates without timezone drift', () => {
    expect(shortDate('2026-03-01')).toBe('Mar 1');
  });

  it('drops a month label that would collide with the next one', () => {
    const ticks = monthTicks([
      '2026-01-25',
      '2026-02-01',
      '2026-02-08',
      '2026-02-15',
      '2026-02-22',
      '2026-03-01',
    ]);
    expect(ticks.map((t) => t.label)).toEqual(['Feb', 'Mar']);
  });
});

describe('contribution cards', () => {
  const cal = sampleCalendar();

  it('calendar has one cell per day and a legend', () => {
    const svg = renderCalendarCard(cal, opts);
    const days = cal.weeks.flat().length;
    expect((svg.match(/<\/title>/g) ?? []).length).toBe(days + 1); // + card title
    expect(svg).toContain('Less');
    expect(svg).toContain('Busiest day');
  });

  it('activity chart marks the peak week and shows streaks', () => {
    const svg = renderActivityCard(cal, opts);
    expect(svg).toContain('Current streak');
    expect(svg).toContain('Longest streak');
    expect(svg).toContain('Week of');
    expect(svg).toContain('pathLength="1"');
  });

  it('handles an empty year', () => {
    const empty = {
      ...cal,
      total: 0,
      weeks: cal.weeks.map((w) => w.map((d) => ({ ...d, count: 0, level: 0 as const }))),
    };
    expect(renderCalendarCard(empty, opts)).not.toContain('Busiest day');
    expect(renderActivityCard(empty, opts)).not.toContain('Week of');
  });
});

describe('activity card options', () => {
  const cal = sampleCalendar();
  const size = (svg: string) =>
    svg
      .match(/width="(\d+)" height="(\d+)"/)!
      .slice(1)
      .map(Number);

  it('renders at the requested width instead of being scaled', () => {
    const [w] = size(renderActivityCard(cal, { ...opts, width: 720 }));
    expect(w).toBe(720);
  });

  it('hide_stats drops the streak strip and shortens the card', () => {
    const full = renderActivityCard(cal, opts);
    const chart = renderActivityCard(cal, { ...opts, hideStats: true });
    expect(chart).not.toContain('Current streak');
    expect(size(chart)[1]!).toBeLessThan(size(full)[1]!);
  });
});
