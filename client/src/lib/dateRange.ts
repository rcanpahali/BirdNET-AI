export type DateRangeFilter = 'all' | '7d' | '30d' | '90d';

const DATE_RANGE_DAYS: Record<Exclude<DateRangeFilter, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 };

/**
 * Millisecond cutoff for "created on/after this point," or `null` for the
 * 'all' range. `Date.now()` is impure, so only call this from an event
 * handler (e.g. a filter's onChange) -- never during render/useMemo.
 */
export function computeDateRangeCutoff(range: DateRangeFilter): number | null {
  if (range === 'all') return null;
  return Date.now() - DATE_RANGE_DAYS[range] * 86_400_000;
}
