import type { AnalyzerResponse } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';

interface ResultsPanelProps {
  results: AnalyzerResponse;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const { detection_count: detectionCount, filename, detections } = results;

  return (
    <div className="mt-8 border-t border-slate-200 pt-6">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Analysis results</h2>
      <p className="mb-4 text-sm text-slate-500">
        Found <strong className="font-semibold text-slate-700">{detectionCount}</strong> detection
        {detectionCount !== 1 ? 's' : ''} in <strong className="font-semibold text-slate-700">{filename}</strong>
      </p>

      {detections.length === 0 ? (
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
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
