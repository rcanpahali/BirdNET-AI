/**
 * Everything in this file is SAMPLE / PLACEHOLDER data standing in for a
 * backend capability that does not exist yet (no persistence, no API).
 * Every export name is prefixed `MOCK_` or `PLACEHOLDER_` on purpose --
 * when the real feature (projects, auth, notifications, tags, audio
 * storage, long-range trend data...) ships server-side, grep for these
 * prefixes to find every spot that needs to be wired up for real.
 */

export interface MockProject {
  id: string;
  name: string;
  description: string;
  targetLocation: string;
  isSample: boolean; // true = has no real data behind it at all
}

// The one project real data is attached to. Analyses aren't actually
// scoped to a project server-side (no `projectId` column exists), so in
// practice this is the *only* project that ever shows real recordings --
// switching to a sample project below is a UI-only preview of the
// planned navigation model.
export const DEFAULT_PROJECT_ID = 'bad-vilbel';

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: DEFAULT_PROJECT_ID,
    name: 'Bad Vilbel Wetlands',
    description: 'Riparian bird monitoring along the Nidda river corridor.',
    targetLocation: 'Bad Vilbel, Hesse, Germany',
    isSample: false,
  },
  {
    id: 'sample-alpine-meadow',
    name: 'Alpine Meadow Survey',
    description: 'Sample project — illustrates multi-project navigation. No recordings are linked to it yet.',
    targetLocation: 'Berchtesgaden National Park, Germany',
    isSample: true,
  },
  {
    id: 'sample-coastal-reserve',
    name: 'Coastal Reserve Transect',
    description: 'Sample project — illustrates multi-project navigation. No recordings are linked to it yet.',
    targetLocation: 'Wadden Sea, Lower Saxony',
    isSample: true,
  },
];

export interface MockUser {
  name: string;
  role: string;
  initials: string;
}

export const MOCK_USER: MockUser = {
  name: 'Guest Researcher',
  role: 'No account system yet',
  initials: 'GR',
};

export interface MockNotification {
  id: string;
  title: string;
  description: string;
  time: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [];

/** Stat-card values with no backing data source at all yet. */
export const PLACEHOLDER_STATS = {
  recordingHoursLabel: '—',
  uploadSuccessRatePercent: null as number | null,
};

export const PLACEHOLDER_NOTE = 'Sample data — backend support not implemented yet';

/** Per-recording fields the schema doesn't have columns for yet. */
export const PLACEHOLDER_RECORDING_QUALITY = 'Not assessed';
export const PLACEHOLDER_TAGS: string[] = [];
export const PLACEHOLDER_NOTES = '';
export const PLACEHOLDER_BACKGROUND_NOISE = 'Unknown';

export interface MockSeasonalPoint {
  season: string;
  thisYear: number;
  lastYear: number;
}

export const MOCK_SEASONAL_COMPARISON: MockSeasonalPoint[] = [
  { season: 'Winter', thisYear: 12, lastYear: 9 },
  { season: 'Spring', thisYear: 34, lastYear: 28 },
  { season: 'Summer', thisYear: 41, lastYear: 37 },
  { season: 'Autumn', thisYear: 19, lastYear: 22 },
];

export interface MockTrendPoint {
  month: string;
  species: number;
}

export const MOCK_SPECIES_TRENDS: MockTrendPoint[] = [
  { month: 'Feb', species: 6 },
  { month: 'Mar', species: 9 },
  { month: 'Apr', species: 14 },
  { month: 'May', species: 18 },
  { month: 'Jun', species: 16 },
  { month: 'Jul', species: 13 },
];

export interface MockHeatCell {
  location: string;
  intensity: number; // 0-1
}

export const MOCK_BIODIVERSITY_HEATMAP: MockHeatCell[] = [
  { location: 'North bank', intensity: 0.82 },
  { location: 'Reed bed', intensity: 0.95 },
  { location: 'Old orchard', intensity: 0.61 },
  { location: 'Weir crossing', intensity: 0.44 },
  { location: 'Meadow edge', intensity: 0.7 },
];
