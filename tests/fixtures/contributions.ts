import type { ContributionCalendar, ContributionDay } from '@/domain/models';

/** Deterministic PRNG so the preview and tests do not change between runs. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const level = (n: number): ContributionDay['level'] =>
  n === 0 ? 0 : n < 3 ? 1 : n < 6 ? 2 : n < 10 ? 3 : 4;

/** A year ending at `end` (Thursday), busier on weekdays and with a spring streak. */
export function sampleCalendar(end = '2026-11-19'): ContributionCalendar {
  const rand = mulberry32(42);
  const last = new Date(`${end}T00:00:00Z`);
  const first = new Date(last);
  first.setUTCDate(first.getUTCDate() - 364);
  first.setUTCDate(first.getUTCDate() - first.getUTCDay()); // Sunday

  const weeks: ContributionDay[][] = [];
  let total = 0;
  for (let d = new Date(first); d <= last; d.setUTCDate(d.getUTCDate() + 1)) {
    const weekday = d.getUTCDay();
    if (weekday === 0 || weeks.length === 0) weeks.push([]);
    const month = d.getUTCMonth();
    const weekend = weekday === 0 || weekday === 6;
    const burst = month >= 2 && month <= 4 ? 2.2 : 1;
    const active = rand() < (weekend ? 0.3 : 0.78);
    const count = active ? Math.round(rand() * 7 * burst + (weekend ? 0 : 1)) : 0;
    total += count;
    weeks.at(-1)!.push({ date: d.toISOString().slice(0, 10), weekday, count, level: level(count) });
  }
  return { login: 'octocat', total, weeks };
}
