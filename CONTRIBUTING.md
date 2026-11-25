# Contributing

Issues and pull requests are welcome. For a new card or a large change, open an issue first.

## Setup

You need [Bun](https://bun.sh).

```sh
cp .env.example .env   # add a GITHUB_TOKEN
bun install
bun run dev
```

`bun run preview` renders every card in every theme with sample data, no token needed.

## Before opening a pull request

```sh
bun run format
bun run typecheck
bun test
```

- Branch from `develop` and target it.
- Use [Conventional Commits](https://www.conventionalcommits.org), e.g. `feat(cards): add releases card`.
- Import with the `@/` and `@tests/` aliases, not relative paths.
- Escape any external text with `esc()` before putting it in an SVG.
- Never show private repository names, even if the token can read them.
- Add tests for new behavior. Tests must not call the network.
