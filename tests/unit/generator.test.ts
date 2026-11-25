import { describe, expect, it } from 'bun:test';
import { app } from '@/app';
import { THEME_NAMES } from '@/themes';

describe('generator page', () => {
  it('renders the form, every theme tile and the client config', async () => {
    const res = await app.request('/');
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('id="controls"');
    for (const name of THEME_NAMES) expect(html).toContain(`data-theme="${name}"`);

    const json = html.match(/<script type="application\/json" id="config">(.*?)<\/script>/s)?.[1];
    const config = JSON.parse(json ?? 'null');
    expect(config.cards.map((c: { id: string }) => c.id)).toEqual([
      'stats',
      'languages',
      'calendar',
      'activity',
      'streak',
      'repos',
      'building',
      'profile',
    ]);
    expect(config.themes).toHaveLength(THEME_NAMES.length);
  });

  it('serves its static assets from the local Bun server', async () => {
    const server = (await import('@/bun')).default;
    for (const path of ['/assets/generator.js', '/assets/generator.css']) {
      const res = await server.fetch(new Request(`http://localhost${path}`));
      expect(res.status).toBe(200);
    }
  });
});
