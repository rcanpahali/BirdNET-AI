import type { Analysis } from '@birdnet/types';
import { i18n } from '../i18n';

/**
 * Derivations computed purely from real `/analyses` data. Nothing in this
 * file is a placeholder -- if a metric can't be honestly derived from the
 * `Analysis`/`Detection` shape, it belongs in `mockData.ts` instead, not here.
 */

export interface SpeciesCount {
  commonName: string;
  scientificName: string;
  count: number;
}

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  label: string; // short display label, e.g. "Mon"
  recordings: number;
  detections: number;
}

export function totalRecordings(analyses: Analysis[]): number {
  return analyses.length;
}

/** Total recording hours across completed analyses (failed analyses have no duration). */
export function recordingHours(analyses: Analysis[]): number {
  const totalSeconds = analyses.reduce((sum, a) => sum + (a.status === 'completed' ? (a.duration ?? 0) : 0), 0);
  return Math.round((totalSeconds / 3600) * 10) / 10;
}

/** Percentage of analyses that completed successfully, or `null` if none have been attempted yet. */
export function uploadSuccessRate(analyses: Analysis[]): number | null {
  if (analyses.length === 0) return null;
  const completed = analyses.filter((a) => a.status === 'completed').length;
  return Math.round((completed / analyses.length) * 100);
}

export function totalDetections(analyses: Analysis[]): number {
  return analyses.reduce((sum, a) => sum + a.detectionCount, 0);
}

export function activeLocationCount(analyses: Analysis[]): number {
  const seen = new Set<string>();
  for (const a of analyses) {
    if (a.lat === null || a.lon === null) continue;
    seen.add(`${a.lat.toFixed(4)},${a.lon.toFixed(4)}`);
  }
  return seen.size;
}

export function speciesDistribution(analyses: Analysis[]): SpeciesCount[] {
  const counts = new Map<string, SpeciesCount>();
  for (const analysis of analyses) {
    for (const detection of analysis.detections) {
      const key = detection.common_name;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          commonName: detection.common_name,
          scientificName: detection.scientific_name,
          count: 1,
        });
      }
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

export function speciesDetectedCount(analyses: Analysis[]): number {
  return speciesDistribution(analyses).length;
}

/**
 * Shannon diversity index (H') over detected species, using detection
 * counts as a proxy for relative abundance. Genuinely derived from
 * real detection data -- not a placeholder -- though it's a coarse proxy
 * since call count isn't the same as individual bird count.
 */
export function shannonBiodiversityIndex(analyses: Analysis[]): number | null {
  const distribution = speciesDistribution(analyses);
  const total = distribution.reduce((sum, s) => sum + s.count, 0);
  if (total === 0 || distribution.length === 0) return null;

  const index = distribution.reduce((acc, s) => {
    const p = s.count / total;
    return acc - p * Math.log(p);
  }, 0);

  return Math.round(index * 100) / 100;
}

function toDateKey(isoLike: string): string {
  return new Date(isoLike).toISOString().slice(0, 10);
}

/** Last 7 calendar days (oldest first) of recording/detection activity. */
export function weeklyActivity(analyses: Analysis[]): DailyActivity[] {
  const days: DailyActivity[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    const dateKey = day.toISOString().slice(0, 10);
    days.push({
      date: dateKey,
      label: day.toLocaleDateString(i18n.language, { weekday: 'short' }),
      recordings: 0,
      detections: 0,
    });
  }

  const byDate = new Map(days.map((d) => [d.date, d]));
  for (const analysis of analyses) {
    const key = toDateKey(analysis.createdAt);
    const bucket = byDate.get(key);
    if (!bucket) continue;
    bucket.recordings += 1;
    bucket.detections += analysis.detectionCount;
  }

  return days;
}

export function recentRecordings(analyses: Analysis[], limit = 5): Analysis[] {
  return [...analyses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function distinctSpeciesNames(analyses: Analysis[]): string[] {
  return speciesDistribution(analyses).map((s) => s.commonName);
}

export interface WeekdayCount {
  day: string;
  recordings: number;
}

/** Recording frequency by day of week, across all history (not just the last 7 days). */
export function recordingFrequencyByWeekday(analyses: Analysis[]): WeekdayCount[] {
  // 2024-01-07 was a Sunday -- Intl gives correctly localized short weekday
  // names for the app's active language, matching `Date#getDay()`'s
  // 0 = Sunday convention used below, without a hand-maintained English array.
  const formatter = new Intl.DateTimeFormat(i18n.language, { weekday: 'short' });
  const labels = Array.from({ length: 7 }, (_, i) => formatter.format(new Date(Date.UTC(2024, 0, 7 + i))));
  const counts = new Array(7).fill(0) as number[];

  for (const analysis of analyses) {
    const day = new Date(analysis.createdAt).getDay();
    counts[day] += 1;
  }

  return labels.map((day, i) => ({ day, recordings: counts[i] }));
}

export type Season = 'winter' | 'spring' | 'summer' | 'autumn';

export interface SeasonCount {
  season: Season;
  recordings: number;
}

// Meteorological seasons, Northern Hemisphere (Dec-Feb winter, ... matches the app's
// primary user base) -- month is `Date#getMonth()`'s 0 = January convention.
const SEASON_BY_MONTH: Season[] = ['winter', 'winter', 'spring', 'spring', 'spring', 'summer', 'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter'];

/** Recording activity grouped by season, across all history (not just the current year). */
export function seasonalActivity(analyses: Analysis[]): SeasonCount[] {
  const counts: Record<Season, number> = { winter: 0, spring: 0, summer: 0, autumn: 0 };

  for (const analysis of analyses) {
    const season = SEASON_BY_MONTH[new Date(analysis.createdAt).getMonth()];
    counts[season] += 1;
  }

  return (['winter', 'spring', 'summer', 'autumn'] satisfies Season[]).map((season) => ({ season, recordings: counts[season] }));
}

export interface LocationCount {
  location: string;
  recordings: number;
}

/** Recordings grouped by rounded GPS coordinate (~1km buckets). */
export function recordingsByLocation(analyses: Analysis[], limit = 8): LocationCount[] {
  const counts = new Map<string, number>();

  for (const analysis of analyses) {
    if (analysis.lat === null || analysis.lon === null) continue;
    const key = `${analysis.lat.toFixed(2)}, ${analysis.lon.toFixed(2)}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([location, recordings]) => ({ location, recordings }))
    .sort((a, b) => b.recordings - a.recordings)
    .slice(0, limit);
}
