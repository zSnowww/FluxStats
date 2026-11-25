import { Hono, type Context } from 'hono';
import type { z } from 'zod';
import {
  BadgeQuerySchema,
  DividerQuerySchema,
  TerminalQuerySchema,
  type CardOptions,
} from '@/domain/StatsSchema';
import { renderBadge, renderDivider, renderTerminal } from '@/cards/decor';
import { renderErrorCard } from '@/cards/error';
import { DEFAULT_THEME, resolveTheme, themes, type Theme, type ThemeName } from '@/themes';

// No external data: the SVG depends only on the URL, so it is cached for a day.
const CACHE_OK = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';
const CACHE_ERROR = 'public, max-age=60';

export const decor = new Hono();

const svg = (body: string, cacheControl: string) =>
  new Response(body, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': cacheControl },
  });

function serveDecor<S extends z.ZodType<CardOptions, unknown>>(
  c: Context,
  schema: S,
  render: (query: z.output<S>, theme: Theme) => string,
): Response {
  const parsed = schema.safeParse(c.req.query());
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const theme = themes[c.req.query('theme') as ThemeName] ?? themes[DEFAULT_THEME];
    return svg(renderErrorCard(`${issue?.path.join('.')}: ${issue?.message}`, theme), CACHE_ERROR);
  }
  const q: z.output<S> = parsed.data;
  return svg(render(q, resolveTheme(q.theme, q)), CACHE_OK);
}

decor.get('/terminal', (c) =>
  serveDecor(c, TerminalQuerySchema, (q, theme) =>
    renderTerminal({
      theme,
      lines: q.lines,
      prompt: q.prompt,
      title: q.title,
      width: q.width,
      hideBorder: q.hide_border,
      animate: q.animate,
    }),
  ),
);

decor.get('/badge', (c) =>
  serveDecor(c, BadgeQuerySchema, (q, theme) =>
    renderBadge({
      theme,
      label: q.label,
      value: q.value,
      icon: q.icon,
      hideBorder: q.hide_border,
      animate: false,
    }),
  ),
);

decor.get('/divider', (c) =>
  serveDecor(c, DividerQuerySchema, (q, theme) =>
    renderDivider({ theme, label: q.label, width: q.width, animate: q.animate }),
  ),
);
