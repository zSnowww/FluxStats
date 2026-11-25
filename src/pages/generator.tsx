import { DEFAULT_THEME, THEME_GROUPS, themes, type ThemeName } from '@/themes';

/**
 * Each card's definition for the generator. The client receives this as JSON,
 * so the page and the routes stay in sync.
 */
export const GENERATOR_CARDS = [
  {
    id: 'stats',
    label: 'Stats',
    alt: 'GitHub stats',
    path: '/api/github/stats',
    fixed: {},
    options: ['show_icons'],
  },
  {
    id: 'languages',
    label: 'Languages',
    alt: 'Top languages',
    path: '/api/github/languages',
    fixed: {},
    options: ['layout', 'palette', 'langs_count', 'hide'],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    alt: 'Contribution calendar',
    path: '/api/github/contributions',
    fixed: { type: 'calendar' },
    options: [],
  },
  {
    id: 'activity',
    label: 'Activity',
    alt: 'Contribution activity and streak',
    path: '/api/github/contributions',
    fixed: { type: 'activity' },
    options: ['hide_stats'],
  },
  {
    id: 'streak',
    label: 'Streak',
    alt: 'Contribution streak',
    path: '/api/github/streak',
    fixed: {},
    options: [],
  },
  {
    id: 'repos',
    label: 'Top repos',
    alt: 'Top repositories',
    path: '/api/github/repos',
    fixed: {},
    options: ['palette', 'repos_count', 'exclude', 'hide_archived'],
  },
  {
    id: 'building',
    label: 'Currently building',
    alt: 'Currently building',
    path: '/api/github/building',
    fixed: {},
    options: ['repos_count'],
  },
  {
    id: 'profile',
    label: 'Profile',
    alt: 'GitHub profile summary',
    path: '/api/github/profile',
    fixed: {},
    options: ['show_icons', 'palette', 'langs_count', 'hide'],
  },
] as const;

/** Parameter defaults: omitted from the generated URL. */
export const GENERATOR_DEFAULTS = {
  theme: DEFAULT_THEME,
  show_icons: 'true',
  hide_border: 'false',
  animate: 'true',
  layout: 'bars',
  palette: 'theme',
  langs_count: '6',
  hide: '',
  repos_count: '5',
  exclude: '',
  hide_archived: 'false',
  hide_stats: 'false',
};

const config = {
  cards: GENERATOR_CARDS,
  /** Parameters that apply to every card. */
  common: ['theme', 'hide_border', 'animate'],
  defaults: GENERATOR_DEFAULTS,
  themes: THEME_GROUPS.flatMap((g) => g.themes),
};

const Swatch = ({ name }: { name: ThemeName }) => {
  const t = themes[name];
  return (
    <span class="swatch" aria-hidden="true">
      <span style={`background:${t.background}`} />
      <span style={`background:${t.accent}`} />
      <span style={`background:${t.title}`} />
    </span>
  );
};

export const GeneratorPage = () => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>FluxStats</title>
      <meta
        name="description"
        content="SVG cards with your GitHub stats for your profile README."
      />
      <link rel="stylesheet" href="/assets/generator.css" />
      <script
        type="application/json"
        id="config"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(config) }}
      />
      <script type="module" src="/assets/generator.js" />
    </head>
    <body>
      <header class="top">
        <div class="wrap">
          <p class="brand">FluxStats</p>
          <p class="tagline">SVG cards with your GitHub stats, for your profile README.</p>
        </div>
      </header>

      <main class="wrap layout">
        <form id="controls" class="panel" autocomplete="off">
          <div class="field">
            <label for="username">GitHub username</label>
            <div class="input-prefix">
              <span aria-hidden="true">@</span>
              <input id="username" name="username" value="octocat" spellcheck={false} required />
            </div>
          </div>

          <fieldset class="field">
            <legend>Card</legend>
            <div class="segmented">
              {GENERATOR_CARDS.map((card, i) => (
                <label>
                  <input type="radio" name="card" value={card.id} checked={i === 0} />
                  <span>{card.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div class="field">
            <label for="theme">Theme</label>
            <select id="theme" name="theme">
              {THEME_GROUPS.map((group) => (
                <optgroup label={group.label}>
                  {group.themes.map((name) => (
                    <option value={name} selected={name === DEFAULT_THEME}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <p class="hint">Or pick one from the gallery below.</p>
          </div>

          {/* Each option appears once; the client shows the ones the selected card uses. */}
          <fieldset class="field" id="options">
            <legend>Options</legend>
            <div class="options-grid">
              <label data-option="layout">
                Layout
                <select name="layout">
                  <option value="bars">Bars</option>
                  <option value="compact">Compact</option>
                </select>
              </label>
              <label data-option="palette">
                Language colors
                <select name="palette">
                  <option value="theme">Accent</option>
                  <option value="github">GitHub</option>
                </select>
              </label>
              <label data-option="langs_count">
                Languages
                <input type="number" name="langs_count" value="6" min="1" max="10" />
              </label>
              <label data-option="repos_count">
                Repositories
                <input type="number" name="repos_count" value="5" min="1" max="10" />
              </label>
              <label data-option="hide" class="wide">
                Hide languages
                <input name="hide" placeholder="html, css" />
              </label>
              <label data-option="exclude" class="wide">
                Exclude repositories
                <input name="exclude" placeholder="dotfiles, old-site" />
              </label>
              <label data-option="show_icons" class="check wide">
                <input type="checkbox" name="show_icons" checked /> Show icons
              </label>
              <label data-option="hide_stats" class="check wide">
                <input type="checkbox" name="hide_stats" /> Chart only (hide streak stats)
              </label>
              <label data-option="hide_archived" class="check wide">
                <input type="checkbox" name="hide_archived" /> Hide archived repositories
              </label>
            </div>
          </fieldset>

          <fieldset class="field">
            <legend>Appearance</legend>
            <label class="check">
              <input type="checkbox" name="hide_border" /> Hide border
            </label>
            <label class="check">
              <input type="checkbox" name="animate" checked /> Animations
            </label>
          </fieldset>
        </form>

        <section class="panel output" aria-label="Preview and embed code">
          <div class="preview" id="preview" aria-live="polite">
            <img id="preview-img" alt="Card preview" />
            <p class="status" id="status" />
          </div>

          <div class="snippet">
            <div class="snippet-head">
              <span>Markdown</span>
              <button type="button" class="copy" data-copy="markdown">
                Copy
              </button>
            </div>
            <pre>
              <code id="markdown" />
            </pre>
          </div>
          <div class="snippet">
            <div class="snippet-head">
              <span>HTML</span>
              <button type="button" class="copy" data-copy="html">
                Copy
              </button>
            </div>
            <pre>
              <code id="html" />
            </pre>
          </div>
        </section>
      </main>

      <section class="wrap gallery-wrap" aria-labelledby="gallery-title">
        <h2 id="gallery-title">All themes</h2>
        {THEME_GROUPS.map((group) => (
          <div class="group">
            <h3>{group.label}</h3>
            <div class="gallery">
              {group.themes.map((name) => (
                <button type="button" class="tile" data-theme={name} aria-pressed="false">
                  <img loading="lazy" alt={`${name} theme`} />
                  <span class="tile-name">
                    <Swatch name={name} />
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </body>
  </html>
);

export const renderGeneratorPage = (): string => `<!doctype html>${(<GeneratorPage />).toString()}`;
