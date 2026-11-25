import type { RepoSummary } from '@/domain/models';
import type { Theme } from '@/themes';
import { compactNumber, esc, truncate } from '@/lib/svg';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import { icons } from '@/cards/icons';
import type { LanguagesPalette } from '@/cards/sections';

export interface ReposCardOptions {
  theme: Theme;
  palette: LanguagesPalette;
  hideBorder: boolean;
  animate: boolean;
}

const WIDTH = 450;
const ROW_HEIGHT = 50;
/** Fixed right-hand columns for stars and forks (SVG cannot measure text). */
const FORK_X = WIDTH - PADDING - 34;
const STAR_X = FORK_X - 54;

const counter = (icon: string, x: number, y: number, value: number) =>
  `<g class="icon" transform="translate(${x}, ${y - 10}) scale(.75)">${icon}</g>
      <text class="small strong" x="${x + 16}" y="${y}">${compactNumber(value)}</text>`;

export function renderReposCard(login: string, repos: RepoSummary[], o: ReposCardOptions): string {
  const t = o.theme;
  const firstY = HEADER_BOTTOM + 30;

  const rows = repos
    .map((repo, i) => {
      const y = firstY + i * ROW_HEIGHT;
      const lang = repo.language
        ? `<text class="small" x="${WIDTH - PADDING - 14}" y="${y + 18}" text-anchor="end">${esc(repo.language.name)}</text>
      <circle cx="${WIDTH - PADDING - 4}" cy="${y + 14}" r="4" fill="${o.palette === 'github' && repo.language.color ? repo.language.color : t.accent}"/>`
        : '';
      const archived = repo.isArchived ? ' · archived' : '';
      return `<g class="row" style="animation-delay:${60 + i * 60}ms">
      <text class="value" x="${PADDING}" y="${y}">${esc(truncate(repo.name, 30))}</text>
      ${counter(icons.star, STAR_X, y, repo.stars)}
      ${counter(icons.fork, FORK_X, y, repo.forks)}
      <text class="small" x="${PADDING}" y="${y + 18}">${esc(truncate(repo.description ?? 'No description', 52))}${archived}</text>
      ${lang}
    </g>`;
    })
    .join('\n');

  const body =
    repos.length > 0
      ? rows
      : `<text class="label" x="${PADDING}" y="${firstY}">No public repositories</text>`;
  const lastY = firstY + Math.max(0, repos.length - 1) * ROW_HEIGHT;

  return renderFrame({
    width: WIDTH,
    height: lastY + (repos.length > 0 ? 18 : 0) + PADDING,
    title: 'Top repositories',
    subtitle: `@${login} · by stars`,
    theme: t,
    hideBorder: o.hideBorder,
    animate: o.animate,
    body,
  });
}
