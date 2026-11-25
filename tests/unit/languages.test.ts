import { describe, expect, it } from 'bun:test';
import { selectTopLanguages } from '@/github/languages';
import { renderLanguagesCard } from '@/cards/languages';
import { resolveTheme } from '@/themes';
import { sampleLanguages } from '@tests/fixtures/languages';

describe('selectTopLanguages', () => {
  it('keeps the top N and folds the rest into Other', () => {
    const top = selectTopLanguages(sampleLanguages, 3);
    expect(top.map((l) => l.name)).toEqual(['TypeScript', 'Python', 'Go', 'Other']);
    expect(top.at(-1)?.isOther).toBe(true);
    expect(top.reduce((acc, l) => acc + l.share, 0)).toBeCloseTo(1);
  });

  it('hides languages case-insensitively and recomputes shares', () => {
    const top = selectTopLanguages(sampleLanguages, 10, ['typescript', 'PYTHON']);
    expect(top.some((l) => l.name === 'TypeScript' || l.name === 'Python')).toBe(false);
    expect(top[0]?.name).toBe('Go');
    expect(top.reduce((acc, l) => acc + l.share, 0)).toBeCloseTo(1);
  });

  it('returns nothing when there is no code', () => {
    expect(selectTopLanguages([], 6)).toEqual([]);
  });
});

describe('renderLanguagesCard', () => {
  const base = { theme: resolveTheme('graphite'), hideBorder: false, animate: true };

  it.each([['bars'], ['compact']] as const)('renders the %s layout', (layout) => {
    const svg = renderLanguagesCard('octocat', selectTopLanguages(sampleLanguages, 6), {
      ...base,
      layout,
      palette: 'theme',
    });
    expect(svg).toContain('TypeScript');
    expect(svg).toContain('Other');
  });

  it('uses Linguist colors only with palette=github', () => {
    const langs = selectTopLanguages(sampleLanguages, 6);
    const themed = renderLanguagesCard('octocat', langs, {
      ...base,
      layout: 'bars',
      palette: 'theme',
    });
    const github = renderLanguagesCard('octocat', langs, {
      ...base,
      layout: 'bars',
      palette: 'github',
    });
    expect(themed).not.toContain('#3178c6');
    expect(github).toContain('#3178c6');
  });

  it('shows an empty state', () => {
    const svg = renderLanguagesCard('octocat', [], { ...base, layout: 'bars', palette: 'theme' });
    expect(svg).toContain('No public code found');
  });
});
