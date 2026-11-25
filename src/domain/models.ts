export interface GitHubStats {
  login: string;
  name: string;
  totalStars: number;
  totalCommits: number;
  totalPRs: number;
  totalIssues: number;
  contributedTo: number;
  followers: number;
  rank: Rank;
}

export interface Rank {
  level: string;
  /** Percentile 0-100: lower is better (1 = top 1%). */
  percentile: number;
}

export interface StreakRange {
  /** Consecutive days with at least one contribution. */
  length: number;
  /** YYYY-MM-DD, null if the streak is 0. */
  start: string | null;
  end: string | null;
}

export interface GitHubStreak {
  current: StreakRange;
  /** The longest within the last year (what the calendar covers). */
  longest: StreakRange;
}

export interface LanguageStat {
  name: string;
  /** Official GitHub Linguist color (may be missing). */
  color: string | null;
  bytes: number;
}

export interface LanguageShare extends LanguageStat {
  /** Fraction 0-1 of the visible total. */
  share: number;
  /** Groups the languages outside the top N. */
  isOther: boolean;
}

export interface UserLanguages {
  login: string;
  languages: LanguageStat[];
}

export interface ContributionDay {
  /** YYYY-MM-DD */
  date: string;
  /** 0 = Sunday */
  weekday: number;
  count: number;
  /** Quartile assigned by GitHub: 0 (none) to 4. */
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionCalendar {
  login: string;
  total: number;
  weeks: ContributionDay[][];
}

export interface RepoSummary {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: { name: string; color: string | null } | null;
  isArchived: boolean;
}

export interface UserRepos {
  login: string;
  repos: RepoSummary[];
}

/** All contributions since the first year with activity. */
export interface ContributionHistory {
  login: string;
  firstYear: number;
  total: number;
  /** Days in chronological order, up to today. */
  days: ContributionDay[];
}

export interface CurrentBuilding {
  login: string;
  from: string;
  to: string;
  total: number;
  repos: Array<{
    name: string;
    commits: number;
    description: string | null;
    language: { name: string; color: string | null } | null;
  }>;
}
