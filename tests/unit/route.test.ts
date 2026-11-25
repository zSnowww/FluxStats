import { describe, expect, it } from 'bun:test';
import { app } from '@/app';

describe('GET /api/github/stats', () => {
  it('returns an SVG error card for invalid input', async () => {
    const res = await app.request('/api/github/stats?username=<bad>');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('image/svg+xml');
    expect(await res.text()).toContain('Invalid GitHub username');
  });
});
