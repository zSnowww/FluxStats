import { z } from 'zod';
import { DEFAULT_THEME, THEME_NAMES } from '@/themes';
import { ICON_NAMES } from '@/cards/icons';

// z.coerce.boolean() treats "false" as true; query params need this instead.
const queryBoolean = (fallback: boolean) =>
  z
    .enum(['true', 'false', '1', '0', ''])
    .optional()
    .transform((v) => (v === undefined ? fallback : v === 'true' || v === '1' || v === ''));

const hexColor = z
  .string()
  .regex(/^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/, 'Must be a valid hex color')
  .transform((v) => (v.startsWith('#') ? v : `#${v}`));

export const ThemeNameSchema = z
  .enum(THEME_NAMES, { errorMap: () => ({ message: 'Unknown theme' }) })
  .default(DEFAULT_THEME);

export const CardOptionsSchema = z.object({
  theme: ThemeNameSchema,
  show_icons: queryBoolean(true),
  hide_border: queryBoolean(false),
  animate: queryBoolean(true),
  bg_color: hexColor.optional(),
  title_color: hexColor.optional(),
  text_color: hexColor.optional(),
  accent_color: hexColor.optional(),
  border_color: hexColor.optional(),
});

const username = z
  .string()
  .min(1, 'Username is required')
  .max(39)
  .regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/, 'Invalid GitHub username');

export const GitHubStatsQuerySchema = CardOptionsSchema.extend({ username });

/** Comma-separated list: `hide=html,css` → ['html', 'css'] */
const csvList = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  );

const palette = z.enum(['theme', 'github']).default('theme');
const langsCount = z.coerce.number().int().min(1).max(10).default(6);

export const LanguagesQuerySchema = CardOptionsSchema.extend({
  username,
  langs_count: langsCount,
  hide: csvList,
  layout: z.enum(['bars', 'compact']).default('bars'),
  palette,
});

export const ContributionsQuerySchema = CardOptionsSchema.extend({
  username,
  type: z.enum(['calendar', 'activity']).default('calendar'),
  /** Only for `activity`. */
  width: z.coerce.number().int().min(360).max(900).default(450),
  hide_stats: queryBoolean(false),
});

export const ReposQuerySchema = CardOptionsSchema.extend({
  username,
  repos_count: z.coerce.number().int().min(1).max(10).default(5),
  exclude: csvList,
  hide_archived: queryBoolean(false),
  palette,
});

export const BuildingQuerySchema = CardOptionsSchema.extend({
  username,
  repos_count: z.coerce.number().int().min(1).max(10).default(5),
});

export const StreakQuerySchema = CardOptionsSchema.extend({ username });

export const ProfileQuerySchema = CardOptionsSchema.extend({
  username,
  langs_count: langsCount,
  hide: csvList,
  palette,
});

export type CardOptions = z.infer<typeof CardOptionsSchema>;
export type GitHubStatsQuery = z.infer<typeof GitHubStatsQuerySchema>;
export type LanguagesQuery = z.infer<typeof LanguagesQuerySchema>;
export type ContributionsQuery = z.infer<typeof ContributionsQuerySchema>;

// ── Decoration (does not query GitHub) ──

const shortText = (max: number) => z.string().trim().min(1).max(max);

export const TerminalQuerySchema = CardOptionsSchema.extend({
  /** Lines separated by `;` */
  lines: z
    .string()
    .transform((v) =>
      v
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().max(80)).min(1, 'At least one line is required').max(8)),
  prompt: shortText(40).default('~ $'),
  title: shortText(60).optional(),
  width: z.coerce.number().int().min(320).max(1000).default(720),
});

export const BadgeQuerySchema = CardOptionsSchema.extend({
  label: shortText(30),
  value: shortText(40).optional(),
  icon: z.enum(ICON_NAMES).optional(),
});

export const DividerQuerySchema = CardOptionsSchema.extend({
  label: shortText(20).optional(),
  width: z.coerce.number().int().min(200).max(1200).default(800),
});
