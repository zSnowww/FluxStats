# Changelog

This project follows [Semantic Versioning](https://semver.org).

## 0.1.1 - 2026-11-25

- Security: update zod to 4.6.7 (GHSA-mrhx-c7xc-m3w5).
- Invalid boolean parameters now show "Must be true or false". Some other validation messages use
  zod 4's wording.
- Update hono to 4.13.20.

## 0.1.0 - 2026-11-25

First public release.

- GitHub cards: stats, languages, contribution calendar, activity, streak, top repositories,
  currently building and profile.
- Decoration: typing terminal, badges and dividers.
- Themes with color overrides, checked for WCAG AA text contrast.
- Card generator page with live preview and Markdown/HTML snippets.
- Self-hosting on Vercel or any server with Bun.
