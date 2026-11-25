import type { ContributionCalendar, GitHubStats, LanguageShare } from '@/domain/models';
import type { Theme } from '@/themes';
import { truncate } from '@/lib/svg';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import {
  githubStatRows,
  languageLegend,
  rankBar,
  segmentedBar,
  statRows,
  statStrip,
  type LanguagesPalette,
} from '@/cards/sections';
import { activityStats } from '@/cards/contributions';

export interface ProfileData {
  stats: GitHubStats;
  languages: LanguageShare[];
  calendar: ContributionCalendar;
}

export interface ProfileCardOptions {
  theme: Theme;
  palette: LanguagesPalette;
  showIcons: boolean;
  hideBorder: boolean;
  animate: boolean;
}

const WIDTH = 720;
const LEFT_WIDTH = 320;
const COLUMN_GAP = 40;

/** Stats + languages in two columns, with the contribution and streak strip below. */
export function renderProfileCard(data: ProfileData, o: ProfileCardOptions): string {
  const t = o.theme;
  const top = HEADER_BOTTOM + 28;

  // Left column: stats and rank.
  const rows = githubStatRows(data.stats);
  const list = statRows({ rows, x: PADDING, y: top, width: LEFT_WIDTH, showIcons: o.showIcons });
  const rank = rankBar({
    rank: data.stats.rank,
    x: PADDING,
    y: list.bottom + 34,
    width: LEFT_WIDTH,
    theme: t,
    delayMs: 60 + rows.length * 60,
  });

  // Right column: languages.
  const rightX = PADDING + LEFT_WIDTH + COLUMN_GAP;
  const rightWidth = WIDTH - PADDING - rightX;
  let right: { svg: string; bottom: number };
  if (data.languages.length > 0) {
    const bar = segmentedBar({
      id: 'profile-langs',
      languages: data.languages,
      x: rightX,
      y: top + 12,
      width: rightWidth,
      theme: t,
      palette: o.palette,
    });
    const legend = languageLegend({
      languages: data.languages,
      x: rightX,
      y: bar.bottom + 24,
      width: rightWidth,
      columns: 1,
      theme: t,
      palette: o.palette,
      rowHeight: 20,
    });
    right = { svg: `${bar.svg}\n${legend.svg}`, bottom: legend.bottom };
  } else {
    right = {
      svg: `<text class="label" x="${rightX}" y="${top + 34}">No public code found</text>`,
      bottom: top + 34,
    };
  }
  const languagesTitle = `<text class="small strong" x="${rightX}" y="${top}">Top languages</text>`;

  const columnsBottom = Math.max(rank.bottom, right.bottom);
  const divider = `<rect x="${PADDING + LEFT_WIDTH + COLUMN_GAP / 2}" y="${HEADER_BOTTOM + 14}" width="1" height="${columnsBottom - HEADER_BOTTOM - 14}" fill="${t.border}"/>`;

  // Bottom: last year's contributions + streak + peak week.
  const strip = statStrip({
    stats: [
      {
        value: data.calendar.total,
        unit: '',
        label: 'Contributions',
        detail: 'Past year',
      },
      ...activityStats(data.calendar),
    ],
    x: PADDING,
    y: columnsBottom + 24,
    width: WIDTH - PADDING * 2,
    theme: t,
  });

  return renderFrame({
    width: WIDTH,
    height: strip.bottom + PADDING - 2,
    title: truncate(data.stats.name, 50),
    subtitle: `@${data.stats.login}`,
    theme: t,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body: `${list.svg}\n${rank.svg}\n${divider}\n${languagesTitle}\n${right.svg}\n${strip.svg}`,
  });
}
