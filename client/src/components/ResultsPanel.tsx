import type { AnalyzerResponse } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';

interface ResultsPanelProps {
  results: AnalyzerResponse;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const { detection_count: detectionCount, filename, detections } = results;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">Analysis results</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Found <strong className="font-semibold text-foreground">{detectionCount}</strong> detection
        {detectionCount !== 1 ? 's' : ''} in <strong className="font-semibold text-foreground">{filename}</strong>
      </p>

      {detections.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          No bird sounds detected with the current confidence threshold.
        </p>
      ) : (
        <div className="grid gap-3">
          {detections.map((detection, index) => (
            <DetectionRow key={`${detection.common_name}-${detection.start_time}-${index}`} detection={detection} />
          ))}
        </div>
      )}
    </div>
  );
}
