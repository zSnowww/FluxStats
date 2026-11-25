import { describe, expect, it } from 'bun:test';
import { renderGitHubStatsCard } from '@/cards/github-stats';
import { THEME_NAMES, resolveTheme } from '@/themes';
import { sampleStats } from '@tests/fixtures/stats';

const opts = { showIcons: true, hideBorder: false, animate: true };

describe('renderGitHubStatsCard', () => {
  it.each(THEME_NAMES.map((t) => [t]))('renders theme %s as valid-looking SVG', (name) => {
    const svg = renderGitHubStatsCard(sampleStats, { ...opts, theme: resolveTheme(name) });
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('12.5k');
    expect(svg).toContain('A+');
  });

  it('escapes user-controlled text', () => {
    const svg = renderGitHubStatsCard(
      { ...sampleStats, name: '<img onerror=x>' },
      { ...opts, theme: resolveTheme('graphite') },
    );
    expect(svg).not.toContain('<img');
    expect(svg).toContain('&lt;img');
  });

  it('applies color overrides', () => {
    const svg = renderGitHubStatsCard(sampleStats, {
      ...opts,
      theme: resolveTheme('graphite', { title_color: '#ff00ff' }),
    });
    expect(svg).toContain('#ff00ff');
  });
});
