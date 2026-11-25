import { describe, expect, it } from 'bun:test';
import { selectTopRepos } from '@/github/repos';
import { renderReposCard } from '@/cards/repos';
import { resolveTheme } from '@/themes';
import { sampleRepos } from '@tests/fixtures/repos';

describe('selectTopRepos', () => {
  it('skips the profile README repo and respects the count', () => {
    const names = selectTopRepos(sampleRepos, 3).map((r) => r.name);
    expect(names).toEqual(['Spoon-Knife', 'Hello-World', 'linguist']);
  });

  it('excludes repos case-insensitively and can hide archived ones', () => {
    const names = selectTopRepos(sampleRepos, 10, ['spoon-knife'], true).map((r) => r.name);
    expect(names).toEqual(['Hello-World', 'linguist', 'test-repo1']);
  });
});

describe('renderReposCard', () => {
  const opts = {
    theme: resolveTheme('graphite'),
    palette: 'theme' as const,
    hideBorder: false,
    animate: true,
  };

  it('renders names, counters and truncated descriptions', () => {
    const svg = renderReposCard('octocat', selectTopRepos(sampleRepos, 5), opts);
    expect(svg).toContain('Spoon-Knife');
    expect(svg).toContain('156k');
    expect(svg).toContain('…');
    expect(svg).toContain('No description');
  });

  it('shows an empty state', () => {
    expect(renderReposCard('octocat', [], opts)).toContain('No public repositories');
  });
});
