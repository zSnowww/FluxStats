import type { Theme } from '@/themes';
import { esc } from '@/lib/svg';

export interface FrameOptions {
  width: number;
  height: number;
  title: string;
  subtitle?: string;
  theme: Theme;
  hideBorder: boolean;
  animate: boolean;
  /** Extra CSS for the specific card. */
  css?: string;
  body: string;
}

export const PADDING = 24;
/** And where the header ends (divider line). */
export const HEADER_BOTTOM = 66;
const RADIUS = 6;

/**
 * SVG document with the typography, theme color classes and base animations.
 * Draws no background: that is up to the caller.
 */
export function svgDocument(o: {
  width: number;
  height: number;
  title: string;
  theme: Theme;
  animate: boolean;
  css?: string;
  body: string;
}): string {
  const { theme: t } = o;

  const animations = o.animate
    ? `
    @keyframes enter { from { opacity: 0; transform: translateY(3px) } to { opacity: 1; transform: none } }
    @keyframes grow { from { transform: scaleX(0) } }
    @keyframes fade { from { opacity: 0 } }
    @keyframes draw { from { stroke-dashoffset: 1 } }
    .row { animation: enter .5s cubic-bezier(.25,.46,.45,.94) both }
    .bar { transform-box: fill-box; transform-origin: left; animation: grow 1.4s cubic-bezier(.12,.88,.2,1) .4s both }
    .fade { animation: fade .8s ease-out both }
    .draw { stroke-dasharray: 1; animation: draw 1.6s cubic-bezier(.4,0,.2,1) .2s both }
    @media (prefers-reduced-motion: reduce) { * { animation: none !important } }`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" fill="none" role="img" aria-labelledby="t">
  <title id="t">${esc(o.title)}</title>
  <style>
    text { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif; font-variant-numeric: tabular-nums }
    .title { font-size: 16px; font-weight: 600; fill: ${t.title} }
    .subtitle { font-size: 12px; fill: ${t.muted} }
    .label { font-size: 13px; fill: ${t.text} }
    .value { font-size: 13px; font-weight: 600; fill: ${t.title} }
    .small { font-size: 11px; fill: ${t.muted} }
    .stat { font-size: 20px; font-weight: 600; fill: ${t.title} }
    .unit { font-size: 12px; font-weight: 400; fill: ${t.muted} }
    .strong { font-weight: 600; fill: ${t.text} }
    .icon { stroke: ${t.accent}; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; fill: none }
    ${animations}
    ${o.css ?? ''}
  </style>
  ${o.body}
</svg>`;
}

/**
 * Shell shared by every card: flat background, border, header
 * (name + subtitle + divider), typography and base animation.
 */
export function renderFrame(o: FrameOptions): string {
  const { theme: t } = o;
  return svgDocument({
    ...o,
    body: `<rect x="0.5" y="0.5" rx="${RADIUS}" width="${o.width - 1}" height="${o.height - 1}" fill="${t.background}"
    stroke="${t.border}" stroke-opacity="${o.hideBorder ? 0 : 1}"/>
  <text class="title" x="${PADDING}" y="34">${esc(o.title)}</text>
  ${o.subtitle ? `<text class="subtitle" x="${PADDING}" y="52">${esc(o.subtitle)}</text>` : ''}
  <rect x="${PADDING}" y="${HEADER_BOTTOM}" width="${o.width - PADDING * 2}" height="1" fill="${t.border}"/>
  ${o.body}`,
  });
}
