import type { AnalyzerResponse } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';

interface ResultsPanelProps {
  results: AnalyzerResponse;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const { detection_count: detectionCount, filename, detections } = results;

  return (
    <div className="mt-8 border-t-2 border-gray-200 pt-8">
      <h2 className="mb-4 text-2xl text-gray-800">Analysis Results</h2>
      <p className="mb-5 text-lg text-gray-600">
        Found <strong>{detectionCount}</strong> detection{detectionCount !== 1 ? 's' : ''} in{' '}
        <strong>{filename}</strong>
      </p>

      {detections.length === 0 ? (
        <p className="rounded-lg bg-red-50 p-5 text-center font-medium text-red-700">
          No bird sounds detected with the current confidence threshold.
        </p>
      ) : (
        <div className="grid gap-4">
          {detections.map((detection, index) => (
            <DetectionRow key={`${detection.common_name}-${detection.start_time}-${index}`} detection={detection} />
          ))}
        </div>
      )}
    </div>
  );
}
