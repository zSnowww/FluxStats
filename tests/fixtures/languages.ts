import type { LanguageStat } from '@/domain/models';

export const sampleLanguages: LanguageStat[] = [
  { name: 'TypeScript', color: '#3178c6', bytes: 1_840_000 },
  { name: 'Python', color: '#3572A5', bytes: 920_000 },
  { name: 'Go', color: '#00ADD8', bytes: 410_000 },
  { name: 'Rust', color: '#dea584', bytes: 260_000 },
  { name: 'Shell', color: '#89e051', bytes: 90_000 },
  { name: 'CSS', color: '#663399', bytes: 70_000 },
  { name: 'HTML', color: '#e34c26', bytes: 40_000 },
  { name: 'Lua', color: '#000080', bytes: 25_000 },
  { name: 'Dockerfile', color: '#384d54', bytes: 6_000 },
];
