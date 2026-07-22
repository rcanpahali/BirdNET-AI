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
      <li className="border-b border-slate-100 px-3 py-2.5 last:border-b-0">
        <div className="mb-0.5 font-medium text-slate-800">{commonName}</div>
        <div className="mb-1 text-[13px] italic text-slate-500">{scientificName}</div>
        <div className="text-xs text-slate-400">
          Confidence: {(confidence * 100).toFixed(1)}% | {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
        </div>
      </li>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-slate-900">{commonName}</h3>
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {(confidence * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mb-2 text-sm italic text-slate-500">{scientificName}</p>
      <div className="text-xs text-slate-400">
        Time: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
      </div>
    </div>
  );
}
