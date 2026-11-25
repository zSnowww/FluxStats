/**
 * Approximate width of text in a monospace font. SVG cannot measure text, so
 * pieces that depend on width (badges, typing cursor) use mono: 0.6em per
 * character, 1em for CJK and emoji (full width).
 */
export function monoWidth(text: string, fontSize: number): number {
  let em = 0;
  for (const ch of text) em += isWide(ch) ? 1 : 0.6;
  return em * fontSize;
}

function isWide(ch: string): boolean {
  const cp = ch.codePointAt(0) ?? 0;
  return (
    (cp >= 0x1100 && cp <= 0x115f) || // Hangul Jamo
    (cp >= 0x2e80 && cp <= 0xa4cf) || // CJK, kana, radicals
    (cp >= 0xac00 && cp <= 0xd7a3) || // Hangul
    (cp >= 0xf900 && cp <= 0xfaff) || // CJK compat
    (cp >= 0xfe30 && cp <= 0xfe4f) ||
    (cp >= 0xff00 && cp <= 0xff60) || // full width
    (cp >= 0xffe0 && cp <= 0xffe6) ||
    (cp >= 0x1f300 && cp <= 0x1faff) // emoji
  );
}

export const MONO_FONT = "'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
