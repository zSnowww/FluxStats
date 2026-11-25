import { Hono, type Context } from 'hono';
import type { z } from 'zod';
import type { AppError } from '@/domain/AppError';
import type { ContributionCalendar, GitHubStats, UserLanguages } from '@/domain/models';
import { failure, success, type Result } from '@/domain/Result';
import {
  BuildingQuerySchema,
  ContributionsQuerySchema,
  GitHubStatsQuerySchema,
  LanguagesQuerySchema,
  ProfileQuerySchema,
  ReposQuerySchema,
  StreakQuerySchema,
  type CardOptions,
} from '@/domain/StatsSchema';
import { fetchGitHubStats } from '@/github/stats';
import { fetchLanguages, selectTopLanguages } from '@/github/languages';
import { fetchContributionHistory, fetchContributions } from '@/github/contributions';
import { fetchCurrentlyBuilding } from '@/github/building';
import { renderBuildingCard } from '@/cards/building';
import { fetchRepos, selectTopRepos } from '@/github/repos';
import { renderErrorCard } from '@/cards/error';
import { renderGitHubStatsCard } from '@/cards/github-stats';
import { renderLanguagesCard } from '@/cards/languages';
import { renderActivityCard, renderCalendarCard } from '@/cards/contributions';
import { renderReposCard } from '@/cards/repos';
import { renderStreakCard } from '@/cards/streak';
import { renderProfileCard } from '@/cards/profile';
import { DEFAULT_THEME, resolveTheme, themes, type Theme, type ThemeName } from '@/themes';

const CACHE_OK = 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_ERROR = 'public, max-age=60';

export const github = new Hono();

// Responds 200 even on error: GitHub (camo) shows a broken image on 4xx/5xx,
// and an error card is more useful to whoever is configuring it.
const svgResponse = (svg: string, cacheControl: string) =>
  new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': cacheControl },
  });

const errorSvg = (message: string, themeName?: string) => {
  const theme = themes[themeName as ThemeName] ?? themes[DEFAULT_THEME];
  return svgResponse(renderErrorCard(message, theme), CACHE_ERROR);
};

const publicMessage = (err: AppError) =>
  err.code === 'INTERNAL_SERVER_ERROR' ? 'Server misconfigured' : err.message;

/** Flow shared by every card: validate query → fetch data → render SVG. */
async function serveCard<S extends z.ZodType<CardOptions & { username: string }, unknown>, D>(
  c: Context,
  schema: S,
  load: (username: string) => Promise<Result<D, AppError>>,
  render: (data: D, query: z.output<S>, theme: Theme) => string,
): Promise<Response> {
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorSvg(`${issue?.path.join('.')}: ${issue?.message}`, c.req.query('theme'));
  }
  const q: z.output<S> = parsed.data;

  const result = await load(q.username);
  if (result.isFailure) {
    if (result.error.code === 'INTERNAL_SERVER_ERROR') console.error(result.error);
    return errorSvg(publicMessage(result.error), q.theme);
  }
  return svgResponse(render(result.value, q, resolveTheme(q.theme, q)), CACHE_OK);
}

github.get('/stats', (c) =>
  serveCard(c, GitHubStatsQuerySchema, fetchGitHubStats, (stats, q, theme) =>
    renderGitHubStatsCard(stats, {
      theme,
      showIcons: q.show_icons,
      hideBorder: q.hide_border,
      animate: q.animate,
    }),
  ),
);

github.get('/languages', (c) =>
  serveCard(c, LanguagesQuerySchema, fetchLanguages, (data, q, theme) =>
    renderLanguagesCard(data.login, selectTopLanguages(data.languages, q.langs_count, q.hide), {
      theme,
      layout: q.layout,
      palette: q.palette,
      hideBorder: q.hide_border,
      animate: q.animate,
    }),
  ),
);

github.get('/contributions', (c) =>
  serveCard(c, ContributionsQuerySchema, fetchContributions, (cal, q, theme) => {
    const opts = { theme, hideBorder: q.hide_border, animate: q.animate };
    return q.type === 'activity'
      ? renderActivityCard(cal, { ...opts, width: q.width, hideStats: q.hide_stats })
      : renderCalendarCard(cal, opts);
  }),
);

github.get('/repos', (c) =>
  serveCard(c, ReposQuerySchema, fetchRepos, (data, q, theme) =>
    renderReposCard(data.login, selectTopRepos(data, q.repos_count, q.exclude, q.hide_archived), {
      theme,
      palette: q.palette,
      hideBorder: q.hide_border,
      animate: q.animate,
    }),
  ),
);

github.get('/streak', (c) =>
  serveCard(c, StreakQuerySchema, fetchContributionHistory, (history, q, theme) =>
    renderStreakCard(history, { theme, hideBorder: q.hide_border, animate: q.animate }),
  ),
);

/** Stats, languages and calendar in parallel; fails with the first error. */
async function fetchProfile(
  username: string,
): Promise<
  Result<{ stats: GitHubStats; languages: UserLanguages; calendar: ContributionCalendar }, AppError>
> {
  const [stats, languages, calendar] = await Promise.all([
    fetchGitHubStats(username),
    fetchLanguages(username),
    fetchContributions(username),
  ]);
  if (stats.isFailure) return failure(stats.error);
  if (languages.isFailure) return failure(languages.error);
  if (calendar.isFailure) return failure(calendar.error);
  return success({ stats: stats.value, languages: languages.value, calendar: calendar.value });
}

github.get('/profile', (c) =>
  serveCard(c, ProfileQuerySchema, fetchProfile, (data, q, theme) =>
    renderProfileCard(
      {
        stats: data.stats,
        languages: selectTopLanguages(data.languages.languages, q.langs_count, q.hide),
        calendar: data.calendar,
      },
      {
        theme,
        palette: q.palette,
        showIcons: q.show_icons,
        hideBorder: q.hide_border,
        animate: q.animate,
      },
    ),
  ),
);

github.get('/building', (c) =>
  serveCard(c, BuildingQuerySchema, fetchCurrentlyBuilding, (data, q, theme) =>
    renderBuildingCard(data, {
      theme,
      reposCount: q.repos_count,
      hideBorder: q.hide_border,
      animate: q.animate,
    }),
  ),
);
