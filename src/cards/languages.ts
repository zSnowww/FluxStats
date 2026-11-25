import type { LanguageShare } from '@/domain/models';
import type { Theme } from '@/themes';
import { esc } from '@/lib/svg';
import { formatPercent } from '@/lib/chart';
import { HEADER_BOTTOM, PADDING, renderFrame } from '@/cards/frame';
import {
  languageLegend,
  languageSwatch,
  progressBar,
  segmentedBar,
  type LanguagesPalette,
} from '@/cards/sections';

export type { LanguagesPalette };

export type LanguagesLayout = 'bars' | 'compact';

export interface LanguagesCardOptions {
  theme: Theme;
  layout: LanguagesLayout;
  /** `theme`: accent shades (subdued). `github`: official Linguist colors. */
  palette: LanguagesPalette;
  hideBorder: boolean;
  animate: boolean;
}

const WIDTH = 450;
const PLOT_WIDTH = WIDTH - PADDING * 2;
export function renderLanguagesCard(
  login: string,
  languages: LanguageShare[],
  o: LanguagesCardOptions,
): string {
  const frame = {
    width: WIDTH,
    title: 'Most used languages',
    subtitle: `@${login} · by code size in public repos`,
    theme: o.theme,
    hideBorder: o.hideBorder,
    animate: o.animate,
  };

  if (languages.length === 0) {
    return renderFrame({
      ...frame,
      height: HEADER_BOTTOM + 52,
      body: `<text class="label" x="${PADDING}" y="${HEADER_BOTTOM + 30}">No public code found</text>`,
    });
  }

  const { body, height } =
    o.layout === 'compact' ? compactLayout(languages, o) : barsLayout(languages, o);
  return renderFrame({ ...frame, height, body });
}

/** One row per language: name, percentage and a bar with its share of the total. */
function barsLayout(languages: LanguageShare[], o: LanguagesCardOptions) {
  const firstY = HEADER_BOTTOM + 30;
  const rowHeight = 34;

  const body = languages
    .map((lang, i) => {
      const y = firstY + i * rowHeight;
      const s = languageSwatch(lang, i, o.theme, o.palette, false);
      return `<g class="row" style="animation-delay:${60 + i * 60}ms">
      <text class="label" x="${PADDING}" y="${y}">${esc(lang.name)}</text>
      <text class="value" x="${WIDTH - PADDING}" y="${y}" text-anchor="end">${formatPercent(lang.share)}</text>
    </g>
    ${progressBar({
      x: PADDING,
      y: y + 8,
      width: PLOT_WIDTH,
      fraction: Math.max(2 / PLOT_WIDTH, lang.share),
      theme: o.theme,
      fill: s.fill,
      opacity: s.opacity,
      delayMs: 300 + i * 60,
    })}`;
    })
    .join('\n');

  return { body, height: firstY + (languages.length - 1) * rowHeight + 12 + PADDING };
}

/** A segmented bar (2px gaps) and a two-column legend. */
function compactLayout(languages: LanguageShare[], o: LanguagesCardOptions) {
  const bar = segmentedBar({
    id: 'seg',
    languages,
    x: PADDING,
    y: HEADER_BOTTOM + 22,
    width: PLOT_WIDTH,
    theme: o.theme,
    palette: o.palette,
  });
  const legend = languageLegend({
    languages,
    x: PADDING,
    y: bar.bottom + 30,
    width: PLOT_WIDTH,
    columns: 2,
    theme: o.theme,
    palette: o.palette,
  });
  return { body: `${bar.svg}\n  ${legend.svg}`, height: legend.bottom + PADDING - 2 };
}
