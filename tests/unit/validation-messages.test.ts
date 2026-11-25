import { describe, expect, it } from 'bun:test';
import { app } from '@/app';

describe('validation messages on error cards', () => {
  const cases: Array<[path: string, message: string]> = [
    ['/api/github/stats', 'username: Username is required'],
    ['/api/github/stats?username=', 'username: Username is required'],
    ['/api/github/stats?username=octocat&theme=nope', 'theme: Unknown theme'],
    ['/api/github/stats?username=octocat&show_icons=maybe', 'show_icons: Must be true or false'],
    ['/api/github/stats?username=octocat&bg_color=zz', 'bg_color: Must be a valid hex color'],
    ['/api/decor/badge', 'label: Required'],
    ['/api/decor/terminal', 'lines: Required'],
  ];

  for (const [path, message] of cases) {
    it(`${path} -> ${message}`, async () => {
      expect(await (await app.request(path)).text()).toContain(`>${message}</text>`);
    });
  }
});
