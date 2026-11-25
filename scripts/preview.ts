// Renders every card in every theme with sample data: run `bun run preview`
// and open preview/index.html. Handy for styling without a token or network.
import { mkdir } from 'node:fs/promises';
import { renderGitHubStatsCard } from '@/cards/github-stats';
import { renderLanguagesCard } from '@/cards/languages';
import { renderActivityCard, renderCalendarCard } from '@/cards/contributions';
import { renderBuildingCard } from '@/cards/building';
import { renderReposCard } from '@/cards/repos';
import { renderStreakCard } from '@/cards/streak';
import { renderProfileCard } from '@/cards/profile';
import { selectTopRepos } from '@/github/repos';
import { selectTopLanguages } from '@/github/languages';
import { THEME_NAMES, resolveTheme } from '@/themes';
import { sampleStats } from '@tests/fixtures/stats';
import { sampleLanguages } from '@tests/fixtures/languages';
import { sampleCalendar } from '@tests/fixtures/contributions';
import { sampleRepos } from '@tests/fixtures/repos';

const out = 'preview';
await mkdir(out, { recursive: true });

const langs = selectTopLanguages(sampleLanguages, 6);
const calendar = sampleCalendar();
const common = { hideBorder: false, animate: true };

const cards: Record<string, (theme: ReturnType<typeof resolveTheme>) => string> = {
  stats: (theme) => renderGitHubStatsCard(sampleStats, { ...common, theme, showIcons: true }),
  'languages-bars': (theme) =>
    renderLanguagesCard('octocat', langs, { ...common, theme, layout: 'bars', palette: 'theme' }),
  'languages-compact': (theme) =>
    renderLanguagesCard('octocat', langs, {
      ...common,
      theme,
      layout: 'compact',
      palette: 'theme',
    }),
  'languages-github': (theme) =>
    renderLanguagesCard('octocat', langs, {
      ...common,
      theme,
      layout: 'compact',
      palette: 'github',
    }),
  activity: (theme) => renderActivityCard(calendar, { ...common, theme }),
  calendar: (theme) => renderCalendarCard(calendar, { ...common, theme }),
  repos: (theme) =>
    renderReposCard('octocat', selectTopRepos(sampleRepos, 5), {
      ...common,
      theme,
      palette: 'theme',
    }),
  streak: (theme) =>
    renderStreakCard(
      { login: 'octocat', firstYear: 2025, total: calendar.total, days: calendar.weeks.flat() },
      { ...common, theme },
    ),
  building: (theme) =>
    renderBuildingCard(
      {
        login: 'octocat',
        from: '2026-10-22',
        to: '2026-11-20',
        total: 189,
        repos: [
          {
            name: 'octocat/FluxStats',
            commits: 48,
            description: 'Dynamic SVG cards for your GitHub README',
            language: null,
          },
          {
            name: 'octocat/Hello-World',
            commits: 24,
            description: 'A place to build and share',
            language: null,
          },
        ],
      },
      { ...common, theme, reposCount: 5 },
    ),
  profile: (theme) =>
    renderProfileCard(
      { stats: sampleStats, languages: selectTopLanguages(sampleLanguages, 6), calendar },
      { ...common, theme, palette: 'theme', showIcons: true },
    ),
};

const sections: string[] = [];
for (const name of THEME_NAMES) {
  const theme = resolveTheme(name);
  const imgs: string[] = [];
  for (const [card, render] of Object.entries(cards)) {
    const file = `${card}-${name}.svg`;
    await Bun.write(`${out}/${file}`, render(theme));
    imgs.push(`<img src="${file}" alt="${card}">`);
  }
  sections.push(`<section><h2>${name}</h2><div>${imgs.join('')}</div></section>`);
}

await Bun.write(
  `${out}/index.html`,
  `<!doctype html><meta charset="utf-8"><title>FluxStats preview</title>
<style>
  body { font-family: system-ui; background: #161616; color: #aaa; padding: 24px; margin: 0 }
  h2 { font-weight: 500; font-size: 14px; margin: 32px 0 12px }
  section div { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start }
  img { max-width: 100% }
</style>
${sections.join('\n')}`,
);
console.log(`Wrote ${THEME_NAMES.length * Object.keys(cards).length} cards to ${out}/`);
