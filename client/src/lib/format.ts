import { i18n } from '../i18n';

/** Short enough to fit a table column without wrapping or forcing horizontal scroll. */
export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleString(i18n.language, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Full date + time, for detail views -- follows the app's selected language, not just the browser's. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(i18n.language);
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const totalSeconds = Math.round(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remaining = totalSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

/** `null` when there are no detections to average -- not the same as a real 0% confidence. */
export function averageConfidence(detections: { confidence: number }[]): number | null {
  if (detections.length === 0) return null;
  const sum = detections.reduce((acc, d) => acc + d.confidence, 0);
  return sum / detections.length;
}

export function formatConfidence(confidence: number | null): string {
  return confidence !== null ? `${(confidence * 100).toFixed(0)}%` : '—';
}

/**
 * The city is only populated for analyses saved after reverse geocoding
 * shipped (or when the lookup succeeded) -- older/failed rows fall back to
 * raw coordinates so a location is still shown whenever one was recorded.
 */
export function formatLocation(
  analysis: { city: string | null; lat: number | null; lon: number | null },
  coordinatePrecision = 3
): string | null {
  if (analysis.city) return analysis.city;
  if (analysis.lat === null || analysis.lon === null) return null;
  return `${analysis.lat.toFixed(coordinatePrecision)}, ${analysis.lon.toFixed(coordinatePrecision)}`;
}
