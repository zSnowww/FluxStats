/**
 * Pieces shared between cards. Each takes its position and returns the SVG
 * plus the `bottom` coordinate where it ends, so the next one can be stacked.
 */
import type { GitHubStats, LanguageShare, Rank } from '@/domain/models';
import type { Theme } from '@/themes';
import { compactNumber, esc } from '@/lib/svg';
import { formatInt, formatPercent } from '@/lib/chart';
import { icons, type IconName } from '@/cards/icons';

export interface Section {
  svg: string;
  bottom: number;
}

const delay = (ms: number) => `style="animation-delay:${ms}ms"`;

// ── Stat rows ──

export interface StatRow {
  icon: IconName;
  label: string;
  value: number;
}

export const githubStatRows = (stats: GitHubStats): StatRow[] => [
  { icon: 'star', label: 'Stars earned', value: stats.totalStars },
  { icon: 'commit', label: 'Commits (past year)', value: stats.totalCommits },
  { icon: 'pr', label: 'Pull requests', value: stats.totalPRs },
  { icon: 'issue', label: 'Issues', value: stats.totalIssues },
  { icon: 'repo', label: 'Contributed to', value: stats.contributedTo },
];

/** Icon + label on the left, right-aligned value. `y` is the baseline of the first row. */
export function statRows(o: {
  rows: StatRow[];
  x: number;
  y: number;
  width: number;
  showIcons: boolean;
  rowHeight?: number;
  delayStart?: number;
}): Section {
  const rowHeight = o.rowHeight ?? 24;
  const delayStart = o.delayStart ?? 60;
  const labelX = o.showIcons ? o.x + 26 : o.x;
  const svg = o.rows
    .map((row, i) => {
      const y = o.y + i * rowHeight;
      const icon = o.showIcons
        ? `<g class="icon" transform="translate(${o.x}, ${y - 12})">${icons[row.icon]}</g>`
        : '';
      return `<g class="row" ${delay(delayStart + i * 60)}>
      ${icon}
      <text class="label" x="${labelX}" y="${y}">${esc(row.label)}</text>
      <text class="value" x="${o.x + o.width}" y="${y}" text-anchor="end">${compactNumber(row.value)}</text>
    </g>`;
    })
    .join('\n');
  return { svg, bottom: o.y + (o.rows.length - 1) * rowHeight };
}

// ── Progress bar ──

/** Track + animated fill. `fraction` between 0 and 1. */
export function progressBar(o: {
  x: number;
  y: number;
  width: number;
  fraction: number;
  theme: Theme;
  height?: number;
  fill?: string;
  opacity?: number;
  delayMs?: number;
}): string {
  const h = o.height ?? 4;
  const filled = Math.max(0, Math.min(1, o.fraction)) * o.width;
  const opacity = o.opacity !== undefined && o.opacity < 1 ? ` fill-opacity="${o.opacity}"` : '';
  const style = o.delayMs !== undefined ? ` ${delay(o.delayMs)}` : '';
  return `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="${h}" rx="${h / 2}" fill="${o.theme.border}"/>
  <rect class="bar"${style} x="${o.x}" y="${o.y}" width="${filled.toFixed(1)}" height="${h}" rx="${h / 2}" fill="${o.fill ?? o.theme.accent}"${opacity}/>`;
}

/** "Rank B-" / "Top 64%" with the bar below. `y` is the text baseline. */
export function rankBar(o: {
  rank: Rank;
  x: number;
  y: number;
  width: number;
  theme: Theme;
  delayMs: number;
}): Section {
  const progress = (100 - o.rank.percentile) / 100;
  const svg = `<g class="row" ${delay(o.delayMs)}>
    <text class="small strong" x="${o.x}" y="${o.y}">Rank ${esc(o.rank.level)}</text>
    <text class="small" x="${o.x + o.width}" y="${o.y}" text-anchor="end">Top ${formatTopPercentile(o.rank.percentile)}</text>
  </g>
  ${progressBar({ x: o.x, y: o.y + 10, width: o.width, fraction: progress, theme: o.theme })}`;
  return { svg, bottom: o.y + 14 };
}

function formatTopPercentile(p: number): string {
  if (p < 1) return '1%';
  return `${p < 10 ? p.toFixed(1).replace(/\.0$/, '') : Math.round(p)}%`;
}

// ── Languages ──

export type LanguagesPalette = 'theme' | 'github';

export interface Swatch {
  fill: string;
  opacity: number;
}

/** Accent opacity steps, from the most used language to the least used. */
const STEPS = [1, 0.78, 0.6, 0.46, 0.36, 0.28, 0.22, 0.18, 0.15, 0.12];

/**
 * A language's color. `stepped`: several languages sharing one bar must be
 * told apart (accent steps); with one bar per language they need not be.
 */
export function languageSwatch(
  lang: LanguageShare,
  index: number,
  theme: Theme,
  palette: LanguagesPalette,
  stepped: boolean,
): Swatch {
  if (lang.isOther) return { fill: theme.muted, opacity: 0.45 };
  if (palette === 'github' && lang.color) return { fill: lang.color, opacity: 1 };
  return { fill: theme.accent, opacity: stepped ? (STEPS[index] ?? 0.12) : 1 };
}

export const paint = (s: Swatch) =>
  `fill="${s.fill}"${s.opacity < 1 ? ` fill-opacity="${s.opacity}"` : ''}`;

/** Segmented bar with 2px gaps and rounded ends. `id` must be unique in the SVG. */
export function segmentedBar(o: {
  id: string;
  languages: LanguageShare[];
  x: number;
  y: number;
  width: number;
  theme: Theme;
  palette: LanguagesPalette;
  height?: number;
}): Section {
  const h = o.height ?? 8;
  const gap = 2;
  const usable = o.width - gap * (o.languages.length - 1);
  let x = o.x;
  const segments = o.languages
    .map((lang, i) => {
      const w = Math.max(1, usable * lang.share);
      const rect = `<rect x="${x.toFixed(1)}" y="${o.y}" width="${w.toFixed(1)}" height="${h}" ${paint(languageSwatch(lang, i, o.theme, o.palette, true))}/>`;
      x += w + gap;
      return rect;
    })
    .join('');
  const svg = `<defs><clipPath id="${o.id}"><rect x="${o.x}" y="${o.y}" width="${o.width}" height="${h}" rx="${h / 2}"/></clipPath></defs>
  <g class="bar" clip-path="url(#${o.id})">${segments}</g>`;
  return { svg, bottom: o.y + h };
}

/** Legend: color dot, name and percentage, in `columns` columns. `y` is the first baseline. */
export function languageLegend(o: {
  languages: LanguageShare[];
  x: number;
  y: number;
  width: number;
  columns: number;
  theme: Theme;
  palette: LanguagesPalette;
  rowHeight?: number;
  delayStart?: number;
}): Section {
  const rowHeight = o.rowHeight ?? 24;
  const colGap = 24;
  const colWidth = (o.width - colGap * (o.columns - 1)) / o.columns;
  const svg = o.languages
    .map((lang, i) => {
      const col = i % o.columns;
      const row = Math.floor(i / o.columns);
      const lx = o.x + col * (colWidth + colGap);
      const ly = o.y + row * rowHeight;
      return `<g class="row" ${delay((o.delayStart ?? 200) + i * 50)}>
      <circle cx="${lx + 4}" cy="${ly - 4.5}" r="4" ${paint(languageSwatch(lang, i, o.theme, o.palette, true))}/>
      <text class="label" x="${lx + 16}" y="${ly}">${esc(lang.name)}</text>
      <text class="value" x="${lx + colWidth}" y="${ly}" text-anchor="end">${formatPercent(lang.share)}</text>
    </g>`;
    })
    .join('\n');
  const rows = Math.ceil(o.languages.length / o.columns);
  return { svg, bottom: o.y + (rows - 1) * rowHeight };
}

// ── Highlighted figures strip ──

export interface StripStat {
  value: number;
  /** Singular unit ("day"); pluralized automatically. Empty = no unit. */
  unit: string;
  label: string;
  detail: string;
}

/** Divider + columns with a large figure, label and detail. `y` is the divider line. */
export function statStrip(o: {
  stats: StripStat[];
  x: number;
  y: number;
  width: number;
  theme: Theme;
  delayStart?: number;
  divider?: boolean;
}): Section {
  const colWidth = o.width / o.stats.length;
  const cols = o.stats
    .map((s, i) => {
      const x = o.x + i * colWidth;
      const unit = s.unit
        ? `<tspan class="unit" dx="4">${s.unit}${s.value === 1 ? '' : 's'}</tspan>`
        : '';
      return `<g class="row" ${delay((o.delayStart ?? 900) + i * 80)}>
      <text class="stat" x="${x}" y="${o.y + 32}">${formatInt(s.value)}${unit}</text>
      <text class="small strong" x="${x}" y="${o.y + 50}">${esc(s.label)}</text>
      <text class="small" x="${x}" y="${o.y + 66}">${esc(s.detail)}</text>
    </g>`;
    })
    .join('\n');
  const divider =
    o.divider === false
      ? ''
      : `<rect x="${o.x}" y="${o.y}" width="${o.width}" height="1" fill="${o.theme.border}"/>`;
  return { svg: `${divider}\n${cols}`, bottom: o.y + 66 };
}
