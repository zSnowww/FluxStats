import { describe, expect, it } from 'bun:test';
import { THEME_GROUPS, THEME_NAMES, themes } from '@/themes';

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

describe('themes', () => {
  it.each(THEME_NAMES.map((n) => [n]))('%s keeps text readable (WCAG AA)', (name) => {
    const t = themes[name];
    expect(contrast(t.title, t.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.text, t.background)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.muted, t.background)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('THEME_GROUPS', () => {
  it('lists every theme exactly once', () => {
    const grouped = THEME_GROUPS.flatMap((g) => g.themes);
    expect([...grouped].sort()).toEqual([...THEME_NAMES].sort());
  });
});
