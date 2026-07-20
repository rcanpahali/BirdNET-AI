import type { Detection } from '@birdnet/types';

interface DetectionRowProps {
  detection: Detection;
  variant?: 'card' | 'compact';
}

export function DetectionRow({ detection, variant = 'card' }: DetectionRowProps) {
  const {
    common_name: commonName,
    scientific_name: scientificName,
    confidence,
    start_time: startTime,
    end_time: endTime,
  } = detection;

  if (variant === 'compact') {
    return (
      <li className="border-b border-gray-100 px-3 py-2.5 last:border-b-0">
        <div className="mb-0.5 font-semibold text-gray-800">{commonName}</div>
        <div className="mb-1 text-[13px] italic text-gray-600">{scientificName}</div>
        <div className="text-xs text-gray-500">
          Confidence: {(confidence * 100).toFixed(1)}% | {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
        </div>
      </li>
    );
  }

  return (
    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-2.5 flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-800">{commonName}</h3>
        <span className="rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] px-3 py-1.5 text-sm font-semibold text-white">
          {(confidence * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mb-2.5 italic text-gray-600">{scientificName}</p>
      <div className="text-sm text-gray-500">
        Time: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
      </div>
    </div>
  );
}
