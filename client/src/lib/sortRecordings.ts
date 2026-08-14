import type { Analysis } from '@birdnet/types';
import { averageConfidence } from './format';

export type RecordingSortKey = 'date' | 'duration' | 'status' | 'detections' | 'speciesCount' | 'confidence';
export type SortDirection = 'asc' | 'desc';

export interface RecordingSort {
  key: RecordingSortKey;
  direction: SortDirection;
}

export const DEFAULT_RECORDING_SORT: RecordingSort = { key: 'date', direction: 'desc' };

function sortValue(analysis: Analysis, key: RecordingSortKey): number | string | null {
  switch (key) {
    case 'date':
      return new Date(analysis.createdAt).getTime();
    case 'duration':
      return analysis.duration;
    case 'status':
      return analysis.status;
    case 'detections':
      return analysis.detectionCount;
    case 'speciesCount':
      return new Set(analysis.detections.map((d) => d.common_name)).size;
    case 'confidence':
      return averageConfidence(analysis.detections);
  }
}

// Missing values (null duration/confidence) always sort to the bottom regardless of
// direction -- an incomplete row climbing to the top on a descending sort would read
// as broken, not informative.
function compareValues(a: number | string | null, b: number | string | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  return (a as number) - (b as number);
}

export function sortAnalyses(analyses: Analysis[], sort: RecordingSort): Analysis[] {
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...analyses].sort((a, b) => factor * compareValues(sortValue(a, sort.key), sortValue(b, sort.key)));
}
