// Local Bun server. Not used on Vercel: there `src/app.ts` is the entry point
// and the CDN serves `public/`.
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { app } from '@/app';

const server = new Hono();

server.use(
  '/assets/*',
  serveStatic({
    root: './public',
    onFound: (_path, c) => c.header('Cache-Control', 'public, max-age=300'),
  }),
);
server.route('/', app);

export default {
  port: Number(process.env.PORT ?? 3100),
  fetch: server.fetch,
};
