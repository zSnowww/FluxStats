import type { ContributionDay, ContributionHistory } from '@/domain/models';
import type { Theme } from '@/themes';
import { dateRange, shortDate } from '@/lib/chart';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import { statStrip } from '@/cards/sections';
import { calculateStreak } from '@/github/streak';

export interface StreakCardOptions {
  theme: Theme;
  hideBorder: boolean;
  animate: boolean;
}

const WIDTH = 450;
const RECENT_DAYS = 30;
const LEVEL_OPACITY = [0, 0.4, 0.6, 0.8, 1] as const;

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function cell(day: ContributionDay, x: number, y: number, w: number, h: number, t: Theme): string {
  const fill =
    day.level === 0
      ? `fill="${t.border}"`
      : `fill="${t.accent}"${day.level < 4 ? ` fill-opacity="${LEVEL_OPACITY[day.level]}"` : ''}`;
  return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="2" ${fill}><title>${plural(day.count, 'contribution')} on ${shortDate(day.date)}</title></rect>`;
}

/** All-time streak: total, current streak, longest streak and the last 30 days. */
export function renderStreakCard(history: ContributionHistory, o: StreakCardOptions): string {
  const t = o.theme;
  const width = WIDTH - PADDING * 2;
  const streak = calculateStreak(history.days);
  const firstActive = history.days.find((d) => d.count > 0)?.date ?? null;

  const strip = statStrip({
    stats: [
      {
        value: history.total,
        unit: '',
        label: 'Total contributions',
        detail: firstActive ? `${dateRange(firstActive, firstActive)} – Present` : '—',
      },
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
    ],
    x: PADDING,
    y: HEADER_BOTTOM - 4,
    width,
    theme: t,
    delayStart: 60,
    divider: false,
  });

  // Last 30 days: a strip of cells showing the current streak at a glance.
  const recent = history.days.slice(-RECENT_DAYS);
  const labelY = strip.bottom + 34;
  const cellsY = labelY + 10;
  const gap = 3;
  const cellW = (width - gap * (RECENT_DAYS - 1)) / RECENT_DAYS;
  const offset = RECENT_DAYS - recent.length;
  const cells = recent
    .map((d, i) => cell(d, PADDING + (offset + i) * (cellW + gap), cellsY, cellW, 18, t))
    .join('');
  const first = recent[0]?.date;

  const footer = `<g class="fade" style="animation-delay:400ms">
    <text class="small strong" x="${PADDING}" y="${labelY}">Last ${RECENT_DAYS} days</text>
    ${cells}
    ${first ? `<text class="small" x="${PADDING}" y="${cellsY + 34}">${shortDate(first)}</text>` : ''}
    <text class="small" x="${WIDTH - PADDING}" y="${cellsY + 34}" text-anchor="end">Today</text>
  </g>`;

  return renderFrame({
    width: WIDTH,
    height: cellsY + 34 + PADDING - 4,
    title: 'Contribution streak',
    subtitle: `@${history.login} · since ${history.firstYear}`,
    theme: t,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body: `${strip.svg}\n${footer}`,
  });
}
