/**
 * Daily counts from a profile's PUBLIC calendar
 * (github.com/users/<login>/contributions), without a token.
 *
 * Why: if the user enables "Private contributions", that calendar adds their
 * private work anonymously (including organizations). The API with a read-only
 * token does not see it. It is what any visitor sees.
 *
 * It is HTML, not an API: if GitHub changes the markup, `parsePublicCalendar`
 * returns nothing and callers fall back to the API numbers.
 */
import { AppError } from '@/domain/AppError';
import type { ContributionDay } from '@/domain/models';
import { failure, success, type Result } from '@/domain/Result';
import { TtlCache } from '@/lib/cache';

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

export function parsePublicCalendar(html: string): ContributionDay[] {
  // Exact count: tooltip linked to the day by `for="<td id>"`.
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/<tool-tip\b([^>]*)>([^<]*)<\/tool-tip>/g)) {
    const id = attr(m[1]!, 'for');
    const text = m[2]!.trim();
    if (!id) continue;
    const n = text.match(/^([\d,]+) contributions? on /)?.[1];
    if (n) counts.set(id, Number(n.replace(/,/g, '')));
    else if (/^No contributions on /.test(text)) counts.set(id, 0);
  }

  const days: ContributionDay[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<td\b[^>]*ContributionCalendar-day[^>]*>/g)) {
    const tag = m[0];
    const date = attr(tag, 'data-date');
    const id = attr(tag, 'id');
    const level = Number(attr(tag, 'data-level'));
    if (!date || !id || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
    const parsedDate = new Date(`${date}T00:00:00Z`);
    if (
      !Number.isFinite(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date ||
      seen.has(date)
    )
      return [];
    seen.add(date);
    const count = counts.get(id);
    if (
      count === undefined ||
      !Number.isSafeInteger(count) ||
      !Number.isInteger(level) ||
      !(level >= 0 && level <= 4)
    )
      return [];
    days.push({
      date,
      weekday: new Date(`${date}T00:00:00Z`).getUTCDay(),
      count,
      level: level as ContributionDay['level'],
    });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}

/** Public calendar; optional `range` for a specific year (YYYY-MM-DD). */
async function loadPublicCalendar(
  login: string,
  range?: { from: string; to: string },
): Promise<Result<ContributionDay[], AppError>> {
  const url = new URL(`https://github.com/users/${encodeURIComponent(login)}/contributions`);
  if (range) url.search = new URLSearchParams(range).toString();
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'fluxstats', Accept: 'text/html', 'Accept-Language': 'en-US' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return failure(AppError.external(`GitHub calendar responded ${res.status}`));
    const days = parsePublicCalendar(await res.text());
    if (days.length === 0) return failure(AppError.external('Could not read the public calendar'));
    return success(days);
  } catch (err) {
    return failure(AppError.external('Could not reach GitHub', { cause: String(err) }));
  }
}

/**
 * Replaces each day's count and level with the public calendar's. Days missing
 * from the public one are left as they were. A count is never lowered: if the
 * public calendar somehow reports less, the API value is kept.
 */
export function withPublicCounts(
  days: ContributionDay[],
  publicDays: ContributionDay[],
): ContributionDay[] {
  const byDate = new Map(publicDays.map((d) => [d.date, d]));
  return days.map((d) => {
    const p = byDate.get(d.date);
    return p && p.count > d.count ? { ...d, count: p.count, level: p.level } : d;
  });
}

// One hour per profile and range, shared by every card on this instance.
const cache = new TtlCache<ContributionDay[]>(60 * 60 * 1000);
const pending = new Map<string, Promise<Result<ContributionDay[], AppError>>>();

export async function fetchPublicCalendar(
  login: string,
  range?: { from: string; to: string },
): Promise<Result<ContributionDay[], AppError>> {
  const key = `${login.toLowerCase()}:${range?.from ?? ''}:${range?.to ?? ''}`;
  const hit = cache.get(key);
  if (hit) return success(hit);
  const existing = pending.get(key);
  if (existing) return existing;
  const request = loadPublicCalendar(login, range)
    .then((result) => {
      if (result.isSuccess) cache.set(key, result.value);
      return result;
    })
    .finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
