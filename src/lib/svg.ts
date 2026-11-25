const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escapes external text (usernames, repo names...). */
export const esc = (value: string | number): string =>
  String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);

/** 1234 -> "1.2k", 1_500_000 -> "1.5M" */
export function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  const units = [
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'k' },
  ];
  for (const { v, s } of units) {
    if (n >= v) return `${(n / v).toFixed(1).replace(/\.0$/, '')}${s}`;
  }
  return String(n);
}

export const truncate = (s: string, max: number): string =>
  s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
