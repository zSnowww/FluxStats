import type { ContributionCalendar, ContributionDay } from '@/domain/models';
import type { Theme } from '@/themes';
import { compactNumber } from '@/lib/svg';
import { dateRange, formatInt, monthTicks, niceMax, shortDate } from '@/lib/chart';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import { calculateStreak } from '@/github/streak';
import { statStrip, type StripStat } from '@/cards/sections';

export interface ContributionsCardOptions {
  theme: Theme;
  hideBorder: boolean;
  animate: boolean;
}

/** Accent opacity per quartile; level 0 uses the border color. */
const LEVEL_OPACITY = [0, 0.4, 0.6, 0.8, 1] as const;

const plural = (n: number, word: string) => `${formatInt(n)} ${word}${n === 1 ? '' : 's'}`;

function busiestDay(cal: ContributionCalendar): ContributionDay | undefined {
  let best: ContributionDay | undefined;
  for (const day of cal.weeks.flat()) if (!best || day.count > best.count) best = day;
  return best && best.count > 0 ? best : undefined;
}

function cellPaint(level: ContributionDay['level'], t: Theme): string {
  if (level === 0) return `fill="${t.border}"`;
  const o = LEVEL_OPACITY[level];
  return `fill="${t.accent}"${o < 1 ? ` fill-opacity="${o}"` : ''}`;
}

/** Heatmap calendar: one column per week, one row per day. */
export function renderCalendarCard(cal: ContributionCalendar, o: ContributionsCardOptions): string {
  const cell = 9;
  const step = 12;
  const gutter = 30;
  const gridX = PADDING + gutter;
  const gridY = HEADER_BOTTOM + 34;
  const width = gridX + cal.weeks.length * step - (step - cell) + PADDING;
  const t = o.theme;

  const months = monthTicks(cal.weeks.map((w) => w[0]?.date ?? ''))
    .map(
      ({ index, label }) =>
        `<text class="small" x="${gridX + index * step}" y="${gridY - 9}">${label}</text>`,
    )
    .join('');

  const weekdays = [
    [1, 'Mon'],
    [3, 'Wed'],
    [5, 'Fri'],
  ]
    .map(
      ([row, label]) =>
        `<text class="small" x="${PADDING}" y="${gridY + Number(row) * step + cell - 1}">${label}</text>`,
    )
    .join('');

  const columns = cal.weeks
    .map((week, col) => {
      const cells = week
        .map(
          (d) =>
            `<rect x="${gridX + col * step}" y="${gridY + d.weekday * step}" width="${cell}" height="${cell}" rx="2" ${cellPaint(d.level, t)}><title>${plural(d.count, 'contribution')} on ${shortDate(d.date)}</title></rect>`,
        )
        .join('');
      return `<g class="fade" style="animation-delay:${col * 14}ms">${cells}</g>`;
    })
    .join('\n');

  const footerY = gridY + 7 * step + 18;
  const legendCells = ([0, 1, 2, 3, 4] as const)
    .map(
      (level, i) =>
        `<rect x="${width - PADDING - 30 - (5 - i) * step}" y="${footerY - cell + 1}" width="${cell}" height="${cell}" rx="2" ${cellPaint(level, t)}/>`,
    )
    .join('');
  const busiest = busiestDay(cal);

  const footer = `
  ${busiest ? `<text class="small" x="${gridX}" y="${footerY}">Busiest day: <tspan class="strong">${shortDate(busiest.date)}</tspan> · ${plural(busiest.count, 'contribution')}</text>` : ''}
  <text class="small" x="${width - PADDING - 34 - 5 * step}" y="${footerY}" text-anchor="end">Less</text>
  ${legendCells}
  <text class="small" x="${width - PADDING}" y="${footerY}" text-anchor="end">More</text>`;

  return renderFrame({
    width,
    height: footerY + PADDING - 4,
    title: 'Contributions',
    subtitle: `@${cal.login} · ${plural(cal.total, 'contribution')} in the past year`,
    theme: t,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body: `${months}${weekdays}\n${columns}\n${footer}`,
  });
}

export interface ActivityCardOptions extends ContributionsCardOptions {
  /** Actual SVG width (not scaled), so text does not grow when stretched. */
  width?: number;
  /** Chart only, without the streak strip (useful next to the profile card). */
  hideStats?: boolean;
}

/** Weekly contribution curve (peak marked) + current and longest streak. */
export function renderActivityCard(cal: ContributionCalendar, o: ActivityCardOptions): string {
  const width = o.width ?? 450;
  const t = o.theme;
  const totals = cal.weeks.map((w) => w.reduce((acc, d) => acc + d.count, 0));
  const max = niceMax(Math.max(0, ...totals));

  const axis = 30;
  const x0 = PADDING + axis;
  const x1 = width - PADDING;
  const top = HEADER_BOTTOM + 34;
  const bottom = top + (width >= 600 ? 130 : 100);
  const xAt = (i: number) => x0 + (i * (x1 - x0)) / Math.max(1, totals.length - 1);
  const yAt = (v: number) => bottom - (v / max) * (bottom - top);

  const grid = [0, max / 2, max]
    .map((v) => {
      const y = yAt(v);
      return `<rect x="${x0}" y="${y.toFixed(1)}" width="${x1 - x0}" height="1" fill="${t.border}"/>
    <text class="small" x="${x0 - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end">${compactNumber(v)}</text>`;
    })
    .join('\n');

  const points = totals.map((v, i) => `${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`);
  const line = `M${points.join('L')}`;
  const area = `${line}L${xAt(totals.length - 1).toFixed(1)},${bottom}L${x0},${bottom}Z`;

  const months = monthTicks(
    cal.weeks.map((w) => w[0]?.date ?? ''),
    4,
  )
    .map(
      ({ index, label }) =>
        `<text class="small" x="${xAt(index).toFixed(1)}" y="${bottom + 18}" text-anchor="middle">${label}</text>`,
    )
    .join('');

  // Selective annotation: only the peak week gets a value.
  const peak = totals.indexOf(Math.max(...totals));
  const peakValue = totals[peak] ?? 0;
  const peakX = xAt(peak);
  const peakY = yAt(peakValue);
  const labelX = Math.min(Math.max(peakX, x0 + 14), x1 - 14);
  const peakMark =
    peakValue > 0
      ? `<g class="fade" style="animation-delay:1.4s">
    <circle cx="${peakX.toFixed(1)}" cy="${peakY.toFixed(1)}" r="4" fill="${t.accent}" stroke="${t.background}" stroke-width="2"/>
    <text class="small strong" x="${labelX.toFixed(1)}" y="${(peakY - 10).toFixed(1)}" text-anchor="middle">${compactNumber(peakValue)}</text>
  </g>`
      : '';

  const strip = o.hideStats
    ? { svg: '', bottom: bottom + 18 }
    : statStrip({
        stats: activityStats(cal),
        x: PADDING,
        y: bottom + 34,
        width: width - PADDING * 2,
        theme: t,
      });

  return renderFrame({
    width,
    height: strip.bottom + (o.hideStats ? PADDING - 6 : PADDING - 2),
    title: 'Activity',
    subtitle: `@${cal.login} · ${plural(cal.total, 'contribution')} in the past year`,
    theme: t,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body: `${grid}
  <path class="fade" style="animation-delay:.6s" d="${area}" fill="${t.accent}" fill-opacity="0.12"/>
  <path class="draw" pathLength="1" d="${line}" stroke="${t.accent}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  ${peakMark}
  ${months}
  ${strip.svg}`,
  });
}

/** Current streak, longest streak and peak week of the last year. */
export function activityStats(cal: ContributionCalendar): StripStat[] {
  const streak = calculateStreak(cal.weeks.flat());
  const totals = cal.weeks.map((w) => w.reduce((acc, d) => acc + d.count, 0));
  const peak = totals.indexOf(Math.max(...totals));
  const peakValue = totals[peak] ?? 0;
  const peakWeek = cal.weeks[peak]?.[0]?.date;
  return [
    {
      value: streak.current.length,
      unit: 'day',
      label: 'Current streak',
      detail: dateRange(streak.current.start, streak.current.end),
    },
    {
      value: streak.longest.length,
      unit: 'day',
      label: 'Longest streak',
      detail: dateRange(streak.longest.start, streak.longest.end),
    },
    {
      value: peakValue,
      unit: '',
      label: 'Peak week',
      detail: peakWeek && peakValue > 0 ? `Week of ${shortDate(peakWeek)}` : '—',
    },
  ];
}
