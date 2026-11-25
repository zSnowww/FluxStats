const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-03-07" -> "Mar 7" (bypasses Date, so it does not depend on the time zone). */
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} ${Number(d)}`;
}

export const monthName = (iso: string): string => MONTHS[Number(iso.slice(5, 7)) - 1] ?? '';

/**
 * Columns where a new month starts. If two labels are closer than `minGap`
 * columns, the first is dropped (usually a partial month).
 */
export function monthTicks(
  firstDates: string[],
  minGap = 3,
): Array<{ index: number; label: string }> {
  const ticks: Array<{ index: number; label: string }> = [];
  let prev = '';
  firstDates.forEach((date, index) => {
    const month = date.slice(0, 7);
    if (month === prev) return;
    prev = month;
    const last = ticks.at(-1);
    if (last && index - last.index < minGap) ticks.pop();
    ticks.push({ index, label: monthName(date) });
  });
  return ticks;
}

/** "Round" axis maximum, fitted to the data: 37 -> 40, 224 -> 250. */
export function niceMax(value: number): number {
  if (value <= 4) return 4;
  const exp = 10 ** Math.floor(Math.log10(value));
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => s * exp >= value) ?? 10;
  return step * exp;
}

export function formatPercent(fraction: number): string {
  const p = fraction * 100;
  if (p < 0.1) return '<0.1%';
  return `${p < 10 ? p.toFixed(1).replace(/\.0$/, '') : Math.round(p)}%`;
}

export const formatInt = (n: number): string => n.toLocaleString('en-US');

/** "Sep 3 – Sep 14", with the year if not the current one: "Dec 28, 2025 – Jan 4". */
export function dateRange(start: string | null, end: string | null, now = new Date()): string {
  if (!start || !end) return '—';
  const year = String(now.getUTCFullYear());
  const fmt = (iso: string) =>
    iso.startsWith(year) ? shortDate(iso) : `${shortDate(iso)}, ${iso.slice(0, 4)}`;
  return start === end ? fmt(start) : `${fmt(start)} – ${fmt(end)}`;
}
