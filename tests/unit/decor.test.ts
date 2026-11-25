import { describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { renderBadge, renderDivider, renderTerminal } from '@/cards/decor';
import { monoWidth } from '@/lib/text';
import { resolveTheme } from '@/themes';

const theme = resolveTheme('ryoku');

describe('monoWidth', () => {
  it('counts CJK characters as full width', () => {
    expect(monoWidth('ab', 10)).toBeCloseTo(12);
    expect(monoWidth('雪', 10)).toBeCloseTo(10);
  });
});

describe('renderTerminal', () => {
  const base = { theme, prompt: '~ $', width: 720, hideBorder: false };

  it('types every line in a loop with SMIL', () => {
    const svg = renderTerminal({ ...base, lines: ['one', 'two & three'], animate: true });
    expect((svg.match(/<clipPath id="type/g) ?? []).length).toBe(2);
    expect(svg).toContain('repeatCount="indefinite"');
    expect(svg).toContain('two &amp; three');
    // keyTimes must start at 0, end at 1 and not repeat instants
    for (const [, times] of svg.matchAll(/keyTimes="([^"]+)"/g)) {
      const t = times!.split(';').map(Number);
      expect(t[0]).toBe(0);
      expect(t.at(-1)).toBe(1);
      for (let i = 1; i < t.length; i++) expect(t[i]!).toBeGreaterThan(t[i - 1]!);
    }
  });

  it('shows the first line statically without animation', () => {
    const svg = renderTerminal({ ...base, lines: ['hello', 'world'], animate: false });
    expect(svg).toContain('>hello<');
    expect(svg).not.toContain('<animate');
  });
});

describe('badge and divider', () => {
  it('badge grows with its text', () => {
    const short = renderBadge({
      theme,
      label: 'Web',
      value: 'a.dev',
      hideBorder: false,
      animate: false,
    });
    const long = renderBadge({
      theme,
      label: 'Web',
      value: 'a-much-longer.dev',
      hideBorder: false,
      animate: false,
    });
    const width = (svg: string) => Number(svg.match(/width="(\d+)"/)?.[1]);
    expect(width(long)).toBeGreaterThan(width(short));
  });

  it('divider works with and without a label', () => {
    expect(renderDivider({ theme, animate: true, width: 800, label: '雪' })).toContain('>雪<');
    expect(renderDivider({ theme, animate: false, width: 800 })).not.toContain('<text');
  });
});

describe('decor routes', () => {
  it('serve SVG and validate input', async () => {
    const ok = await app.request('/api/decor/badge?label=Web&value=zsnow.dev&icon=globe');
    expect(ok.headers.get('content-type')).toContain('image/svg+xml');
    expect(await ok.text()).toContain('zsnow.dev');

    const bad = await app.request('/api/decor/terminal?lines=');
    expect(await bad.text()).toContain('Could not render card');

    const badIcon = await app.request('/api/decor/badge?label=x&icon=nope');
    expect(await badIcon.text()).toContain('Could not render card');
  });
});
