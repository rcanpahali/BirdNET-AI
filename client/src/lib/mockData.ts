/**
 * Everything in this file is SAMPLE / PLACEHOLDER data standing in for a
 * backend capability that does not exist yet (no persistence, no API).
 * Every export name is prefixed `MOCK_` or `PLACEHOLDER_` on purpose --
 * when the real feature (auth, notifications, audio storage, long-range
 * trend data...) ships server-side, grep for these prefixes to find every
 * spot that needs to be wired up for real.
 */

export interface MockUser {
  initials: string;
}

/** Name/role are translated (see topNov.guestName/guestRole) -- initials are a fixed avatar placeholder, not derived from the translated name. */
export const MOCK_USER: MockUser = {
  initials: 'GR',
};

export interface MockNotification {
  id: string;
  title: string;
  description: string;
  time: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [];

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface MockSeasonalPoint {
  season: Season;
  thisYear: number;
  lastYear: number;
}

export const MOCK_SEASONAL_COMPARISON: MockSeasonalPoint[] = [
  { season: 'winter', thisYear: 12, lastYear: 9 },
  { season: 'spring', thisYear: 34, lastYear: 28 },
  { season: 'summer', thisYear: 41, lastYear: 37 },
  { season: 'autumn', thisYear: 19, lastYear: 22 },
];

export interface MockTrendPoint {
  /** 0-11 (Jan-Dec) -- language-agnostic; StatisticsPage derives the display label via Intl. */
  monthIndex: number;
  species: number;
}

export const MOCK_SPECIES_TRENDS: MockTrendPoint[] = [
  { monthIndex: 1, species: 6 },
  { monthIndex: 2, species: 9 },
  { monthIndex: 3, species: 14 },
  { monthIndex: 4, species: 18 },
  { monthIndex: 5, species: 16 },
  { monthIndex: 6, species: 13 },
];

export type HeatmapLocation = 'northBank' | 'reedBed' | 'oldOrchard' | 'weirCrossing' | 'meadowEdge';

export interface MockHeatCell {
  location: HeatmapLocation;
  intensity: number; // 0-1
}

export const MOCK_BIODIVERSITY_HEATMAP: MockHeatCell[] = [
  { location: 'northBank', intensity: 0.82 },
  { location: 'reedBed', intensity: 0.95 },
  { location: 'oldOrchard', intensity: 0.61 },
  { location: 'weirCrossing', intensity: 0.44 },
  { location: 'meadowEdge', intensity: 0.7 },
];
