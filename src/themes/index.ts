/**
 * A theme is a set of tokens. Cards never use loose colors: everything goes
 * through here, so adding a theme means adding one object.
 *
 * Rules: flat background, a single accent, and `text`/`muted` with contrast
 * >= 4.5:1 over the background (checked by tests/unit/themes.test.ts).
 */
export interface Theme {
  background: string;
  border: string;
  /** Name and numeric values. */
  title: string;
  /** Row labels. */
  text: string;
  /** Secondary text: @login, percentages. */
  muted: string;
  /** Icons and progress bar. */
  accent: string;
}

export const themes = {
  // ── FluxStats ──
  graphite: {
    background: '#0f1115',
    border: '#252a33',
    title: '#e6e8eb',
    text: '#a3aab5',
    muted: '#7c8491',
    accent: '#8fa8c8',
  },
  midnight: {
    background: '#0b0f17',
    border: '#1c2433',
    title: '#dbe4f0',
    text: '#9aa7b8',
    muted: '#76839a',
    accent: '#6b93d6',
  },
  forest: {
    background: '#0f1a17',
    border: '#1f2f2a',
    title: '#d6e5df',
    text: '#9fb5ad',
    muted: '#7b938a',
    accent: '#4fae86',
  },
  ember: {
    background: '#141110',
    border: '#2a2320',
    title: '#ece3dc',
    text: '#b3a69c',
    muted: '#8f8178',
    accent: '#c98a55',
  },
  // ── Ryoku static schemes (`ryoku-shell theme catalog`) ──
  nord: {
    background: '#2e3440',
    border: '#3b4252',
    title: '#eceff4',
    text: '#d8dee9',
    muted: '#a3acbd',
    accent: '#88c0d0',
  },
  'tokyo-night': {
    background: '#1a1b26',
    border: '#292e42',
    title: '#c0caf5',
    text: '#a9b1d6',
    muted: '#7f88b4',
    accent: '#7aa2f7',
  },
  'catppuccin-mocha': {
    background: '#1e1e2e',
    border: '#313244',
    title: '#cdd6f4',
    text: '#bac2de',
    muted: '#9399b2',
    accent: '#cba6f7',
  },
  'rose-pine': {
    background: '#191724',
    border: '#26233a',
    title: '#e0def4',
    text: '#a6a2c2',
    muted: '#8a86a6',
    accent: '#ebbcba',
  },
  gruvbox: {
    background: '#282828',
    border: '#3c3836',
    title: '#ebdbb2',
    text: '#d5c4a1',
    muted: '#a89984',
    accent: '#d79921',
  },
  dracula: {
    background: '#282a36',
    border: '#41434d',
    title: '#f8f8f2',
    text: '#cacbc9',
    muted: '#8692b7',
    accent: '#bd93f9',
  },
  everforest: {
    background: '#232a2e',
    border: '#383d3d',
    title: '#d3c6aa',
    text: '#aca48f',
    muted: '#8e9383',
    accent: '#a7c080',
  },
  kanagawa: {
    background: '#1f1f28',
    border: '#36353a',
    title: '#dcd7ba',
    text: '#b2af9a',
    muted: '#938aa9',
    accent: '#7e9cd8',
  },
  'one-dark': {
    background: '#282c34',
    border: '#3e4149',
    title: '#dcdfe4',
    text: '#abb2bf',
    muted: '#90949d',
    accent: '#61afef',
  },
  'solarized-dark': {
    background: '#002b36',
    border: '#1d4249',
    title: '#eee8d5',
    text: '#93a1a1',
    muted: '#839496',
    accent: '#268bd2',
  },
  // ── Omarchy themes (~/.config/omarchy/themes/*/colors.toml) ──
  ryoku: {
    background: '#0e0e12',
    border: '#28201e',
    title: '#f5f2eb',
    text: '#c2c0bb',
    muted: '#8c8780',
    accent: '#e0563b',
  },
  aether: {
    background: '#141417',
    border: '#2d2d38',
    title: '#f4f4f5',
    text: '#d4d4d8',
    muted: '#818189',
    accent: '#c5f015',
  },
  'aether-sakura': {
    background: '#151318',
    border: '#2c2333',
    title: '#f9f0f5',
    text: '#e8d6e3',
    muted: '#b89aae',
    accent: '#f472b6',
  },
  // ── GitHub ──
  'github-dark': {
    background: '#0d1117',
    border: '#30363d',
    title: '#e6edf3',
    text: '#9198a1',
    muted: '#7d8590',
    accent: '#4493f8',
  },
  'github-light': {
    background: '#ffffff',
    border: '#d1d9e0',
    title: '#1f2328',
    text: '#424a53',
    muted: '#59636e',
    accent: '#0969da',
  },
  paper: {
    background: '#fbfaf8',
    border: '#e6e2db',
    title: '#1c1b19',
    text: '#4a4741',
    muted: '#6b665e',
    accent: '#8a6d3b',
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;

export const DEFAULT_THEME: ThemeName = 'graphite';

export const THEME_NAMES = Object.keys(themes) as [ThemeName, ...ThemeName[]];

export interface ThemeOverrides {
  bg_color?: string;
  title_color?: string;
  text_color?: string;
  accent_color?: string;
  border_color?: string;
}

export function resolveTheme(name: ThemeName, o: ThemeOverrides = {}): Theme {
  const base: Theme = themes[name];
  return {
    ...base,
    background: o.bg_color ?? base.background,
    title: o.title_color ?? base.title,
    text: o.text_color ?? base.text,
    accent: o.accent_color ?? base.accent,
    border: o.border_color ?? base.border,
  };
}

/** Theme grouping for display (generator, README). */
export const THEME_GROUPS: Array<{ label: string; themes: ThemeName[] }> = [
  { label: 'FluxStats', themes: ['graphite', 'midnight', 'forest', 'ember'] },
  {
    label: 'Ryoku',
    themes: [
      'nord',
      'tokyo-night',
      'catppuccin-mocha',
      'rose-pine',
      'gruvbox',
      'dracula',
      'everforest',
      'kanagawa',
      'one-dark',
      'solarized-dark',
    ],
  },
  { label: 'Omarchy', themes: ['ryoku', 'aether', 'aether-sakura'] },
  { label: 'GitHub', themes: ['github-dark', 'github-light', 'paper'] },
];
