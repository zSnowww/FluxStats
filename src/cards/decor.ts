/**
 * Decorative README pieces: typing terminal, link badges and dividers.
 * They request no GitHub data; they only use the theme.
 */
import type { Theme } from '@/themes';
import { esc } from '@/lib/svg';
import { MONO_FONT, monoWidth } from '@/lib/text';
import { svgDocument } from '@/cards/frame';
import { icons, type IconName } from '@/cards/icons';

interface DecorOptions {
  theme: Theme;
  hideBorder: boolean;
  animate: boolean;
}

const MONO_CSS = `.mono { font-family: ${MONO_FONT} }`;
const RADIUS = 6;

const background = (w: number, h: number, t: Theme, hideBorder: boolean) =>
  `<rect x="0.5" y="0.5" rx="${RADIUS}" width="${w - 1}" height="${h - 1}" fill="${t.background}" stroke="${t.border}" stroke-opacity="${hideBorder ? 0 : 1}"/>`;

// ── Typing terminal ──

export interface TerminalOptions extends DecorOptions {
  lines: string[];
  prompt: string;
  title?: string;
  width: number;
}

const TYPE_SPEED = 0.055; // s per character
const HOLD = 1.8;
const GAP = 0.35;

/** SMIL keyframes: absolute times -> normalized keyTimes (no repeated instants). */
function keyframes(points: Array<[number, number]>, total: number) {
  const out: Array<[number, number]> = [];
  for (const [time, value] of points) {
    const last = out.at(-1);
    if (last && time <= last[0]) {
      last[1] = value;
      continue;
    }
    out.push([time, value]);
  }
  return {
    keyTimes: out.map(([time]) => (time / total).toFixed(4)).join(';'),
    values: out.map(([, value]) => value.toFixed(1)).join(';'),
  };
}

/**
 * Terminal window that types and erases each line in a loop (SMIL, which GitHub
 * does animate inside an <img>). Without animation it shows the first line.
 */
export function renderTerminal(o: TerminalOptions): string {
  const t = o.theme;
  const height = 104;
  const fontSize = 15;
  const textY = 76;
  const promptX = 24;
  const x0 = promptX + monoWidth(`${o.prompt} `, fontSize);

  const chrome = `<circle cx="22" cy="20" r="4.5" fill="${t.accent}"/>
  <circle cx="38" cy="20" r="4.5" fill="${t.muted}" fill-opacity=".55"/>
  <circle cx="54" cy="20" r="4.5" fill="${t.muted}" fill-opacity=".3"/>
  ${o.title ? `<text class="mono small" x="${o.width / 2}" y="24" text-anchor="middle">${esc(o.title)}</text>` : ''}
  <rect x="0" y="40" width="${o.width}" height="1" fill="${t.border}"/>`;

  const prompt = `<text class="mono" x="${promptX}" y="${textY}" fill="${t.accent}" font-size="${fontSize}" font-weight="600">${esc(o.prompt)}</text>`;

  if (!o.animate) {
    const first = o.lines[0] ?? '';
    return svgDocument({
      width: o.width,
      height,
      title: o.lines.join(' · '),
      theme: t,
      animate: false,
      css: MONO_CSS,
      body: `${background(o.width, height, t, o.hideBorder)}
  ${chrome}
  ${prompt}
  <text class="mono" x="${x0}" y="${textY}" fill="${t.title}" font-size="${fontSize}">${esc(first)}</text>
  <rect x="${x0 + monoWidth(first, fontSize) + 2}" y="${textY - 14}" width="8" height="18" fill="${t.accent}"/>`,
    });
  }

  // Each line takes one segment: type, hold, erase, pause.
  const slots = o.lines.map((line) => {
    const typing = Math.max(0.4, line.length * TYPE_SPEED);
    const erase = Math.min(0.6, Math.max(0.25, line.length * 0.015));
    return { line, width: monoWidth(line, fontSize) + 2, typing, erase };
  });
  let cursor = 0;
  const timed = slots.map((s) => {
    const start = cursor;
    cursor += s.typing + HOLD + s.erase + GAP;
    return { ...s, start };
  });
  const total = cursor;

  const caretPoints: Array<[number, number]> = [];
  const lines = timed
    .map((s, i) => {
      const typed = s.start + s.typing;
      const held = typed + HOLD;
      const erased = held + s.erase;
      const frames = keyframes(
        [
          [0, 0],
          [s.start, 0],
          [typed, s.width],
          [held, s.width],
          [erased, 0],
          [total, 0],
        ],
        total,
      );
      caretPoints.push([s.start, x0], [typed, x0 + s.width], [held, x0 + s.width], [erased, x0]);
      return `<clipPath id="type${i}"><rect x="${x0}" y="${textY - 20}" width="0" height="28">
      <animate attributeName="width" dur="${total.toFixed(2)}s" repeatCount="indefinite" keyTimes="${frames.keyTimes}" values="${frames.values}"/>
    </rect></clipPath>
  <text class="mono" x="${x0}" y="${textY}" fill="${t.title}" font-size="${fontSize}" clip-path="url(#type${i})">${esc(s.line)}</text>`;
    })
    .join('\n  ');

  const caret = keyframes([[0, x0], ...caretPoints, [total, x0]], total);

  return svgDocument({
    width: o.width,
    height,
    title: o.lines.join(' · '),
    theme: t,
    animate: true,
    css: `${MONO_CSS}
    @keyframes blink { 50% { opacity: 0 } }
    .caret { animation: blink 1s steps(1) infinite }`,
    body: `${background(o.width, height, t, o.hideBorder)}
  ${chrome}
  ${prompt}
  ${lines}
  <rect class="caret" x="${x0}" y="${textY - 14}" width="8" height="18" fill="${t.accent}">
    <animate attributeName="x" dur="${total.toFixed(2)}s" repeatCount="indefinite" keyTimes="${caret.keyTimes}" values="${caret.values}"/>
  </rect>`,
  });
}

// ── Link badge ──

export interface BadgeOptions extends DecorOptions {
  label: string;
  value?: string;
  icon?: IconName;
}

/** Badge with icon, label and value. Wrapped in an <a> in the README. */
export function renderBadge(o: BadgeOptions): string {
  const t = o.theme;
  const height = 30;
  const fontSize = 12;
  const pad = 11;
  const iconW = o.icon ? 14 + 8 : 0;
  const label = o.label.toUpperCase();
  const labelW = monoWidth(label, fontSize - 1) + 1;
  const leftW = pad + iconW + labelW + pad;
  const valueW = o.value ? monoWidth(o.value, fontSize) : 0;
  const width = Math.ceil(leftW + (o.value ? 1 + pad + valueW + pad : 0));
  const y = height / 2 + 4;

  const icon = o.icon
    ? `<g class="icon" transform="translate(${pad}, ${height / 2 - 7}) scale(.875)">${icons[o.icon]}</g>`
    : '';
  const value = o.value
    ? `<rect x="${leftW}" y="7" width="1" height="${height - 14}" fill="${t.border}"/>
  <text class="mono" x="${leftW + 1 + pad}" y="${y}" fill="${t.title}" font-size="${fontSize}" font-weight="600">${esc(o.value)}</text>`
    : '';

  return svgDocument({
    width,
    height,
    title: o.value ? `${o.label}: ${o.value}` : o.label,
    theme: t,
    animate: false,
    css: MONO_CSS,
    body: `${background(width, height, t, o.hideBorder)}
  ${icon}
  <text class="mono" x="${pad + iconW}" y="${y}" fill="${t.muted}" font-size="${fontSize - 1}" letter-spacing=".04em">${esc(label)}</text>
  ${value}`,
  });
}

// ── Divider ──

export interface DividerOptions {
  theme: Theme;
  animate: boolean;
  label?: string;
  width: number;
}

/**
 * Thin line with an optional centered label (a kanji, a word).
 * Transparent background so it blends into the page.
 */
export function renderDivider(o: DividerOptions): string {
  const t = o.theme;
  const height = 32;
  const mid = o.width / 2;
  const y = height / 2;
  const labelW = o.label ? monoWidth(o.label, 13) : 0;
  const gap = o.label ? labelW / 2 + 22 : 8;

  const css = `${MONO_CSS}
    .side { transform-box: fill-box }
    .left { transform-origin: right }
    .right { transform-origin: left }
    ${o.animate ? '.side { animation: grow 1.2s cubic-bezier(.12,.88,.2,1) both }' : ''}`;

  const label = o.label
    ? `<rect x="${mid - gap + 8}" y="${y - 2.5}" width="5" height="5" transform="rotate(45 ${mid - gap + 10.5} ${y})" fill="${t.accent}"/>
  <text class="mono" x="${mid}" y="${y + 4.5}" text-anchor="middle" fill="${t.title}" font-size="13" font-weight="600">${esc(o.label)}</text>
  <rect x="${mid + gap - 13}" y="${y - 2.5}" width="5" height="5" transform="rotate(45 ${mid + gap - 10.5} ${y})" fill="${t.accent}"/>`
    : '';

  return svgDocument({
    width: o.width,
    height,
    title: o.label ?? 'divider',
    theme: t,
    animate: o.animate,
    css,
    body: `<defs>
    <linearGradient id="fade-l" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity="0"/><stop offset="1" stop-color="${t.accent}" stop-opacity=".7"/></linearGradient>
    <linearGradient id="fade-r" x1="0" x2="1"><stop offset="0" stop-color="${t.accent}" stop-opacity=".7"/><stop offset="1" stop-color="${t.accent}" stop-opacity="0"/></linearGradient>
  </defs>
  <rect class="side left" x="0" y="${y - 0.5}" width="${Math.max(0, mid - gap)}" height="1" fill="url(#fade-l)"/>
  <rect class="side right" x="${mid + gap}" y="${y - 0.5}" width="${Math.max(0, mid - gap)}" height="1" fill="url(#fade-r)"/>
  ${label}`,
  });
}
