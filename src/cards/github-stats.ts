import type { GitHubStats } from '@/domain/models';
import type { Theme } from '@/themes';
import { truncate } from '@/lib/svg';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import { githubStatRows, rankBar, statRows } from '@/cards/sections';

export interface StatsCardOptions {
  theme: Theme;
  showIcons: boolean;
  hideBorder: boolean;
  animate: boolean;
}

const WIDTH = 450;

export function renderGitHubStatsCard(stats: GitHubStats, o: StatsCardOptions): string {
  const rows = githubStatRows(stats);
  const width = WIDTH - PADDING * 2;
  const list = statRows({ rows, x: PADDING, y: HEADER_BOTTOM + 28, width, showIcons: o.showIcons });
  const rank = rankBar({
    rank: stats.rank,
    x: PADDING,
    y: list.bottom + 34,
    width,
    theme: o.theme,
    delayMs: 60 + rows.length * 60,
  });

  return renderFrame({
    width: WIDTH,
    height: rank.bottom + PADDING,
    title: truncate(stats.name, 34),
    subtitle: `@${stats.login}`,
    theme: o.theme,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body: `${list.svg}\n${rank.svg}`,
  });
}
