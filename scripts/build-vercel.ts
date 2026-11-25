// Vercel build using the Build Output API v3 (https://vercel.com/docs/build-output-api).
//
// Vercel's Hono builder compiles file by file and does not resolve tsconfig
// aliases (`@/…`), so the function was deployed without its modules.
// Here Bun bundles everything (aliases, JSX, hono, zod) into a single file.
import { cp, mkdir, rm } from 'node:fs/promises';

const out = '.vercel/output';
const fn = `${out}/functions/index.func`;

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });

const result = await Bun.build({
  entrypoints: ['src/app.ts'],
  outdir: fn,
  naming: 'index.js',
  target: 'bun',
  format: 'esm',
  sourcemap: 'linked',
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

await Bun.write(`${fn}/package.json`, JSON.stringify({ type: 'module' }));
await Bun.write(
  `${fn}/.vc-config.json`,
  JSON.stringify(
    {
      handler: 'index.js',
      runtime: 'bun1.x',
      launcherType: 'Nodejs',
      shouldAddHelpers: true,
      shouldAddSourcemapSupport: true,
      framework: { slug: 'hono' },
    },
    null,
    2,
  ),
);

// `public/` is served from the CDN.
await cp('public', `${out}/static`, { recursive: true });

// Anything that is not a static file goes to the function, keeping the original path.
await Bun.write(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: 'filesystem' },
        {
          src: '/(.*)',
          dest: '/',
          transforms: [{ type: 'request.path', op: 'set', args: '/$1' }],
        },
      ],
    },
    null,
    2,
  ),
);

const size = (await Bun.file(`${fn}/index.js`).size) / 1024;
console.log(`Built ${out} (function: ${size.toFixed(0)} KB)`);
