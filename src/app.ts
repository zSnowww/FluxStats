import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { github } from '@/routes/github';
import { decor } from '@/routes/decor';
import { renderGeneratorPage } from '@/pages/generator';
import { renderErrorCard } from '@/cards/error';
import { DEFAULT_THEME, themes, type ThemeName } from '@/themes';

/**
 * Runtime-agnostic app. On Vercel this is the entry point (default export)
 * and the CDN serves `public/` directly. Locally, `src/bun.ts` adds the
 * static files.
 */
export const app = new Hono();

app.use(logger());

// Last resort: an unexpected error in a card returns an error card (200, short
// cache) instead of a 500, which a README shows as a broken image.
app.onError((err, c) => {
  console.error(err);
  if (!c.req.path.startsWith('/api/')) return c.text('Internal Server Error', 500);
  const theme = themes[c.req.query('theme') as ThemeName] ?? themes[DEFAULT_THEME];
  return c.body(renderErrorCard('Something went wrong, try again later', theme), 200, {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=60',
  });
});

app.get('/', (c) => c.html(renderGeneratorPage()));
app.get('/health', (c) => c.json({ ok: true }));
app.route('/api/github', github);
app.route('/api/decor', decor);

export default app;
