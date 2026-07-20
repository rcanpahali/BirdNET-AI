import type { Analysis } from '@birdnet/types';
import { DetectionRow } from '../DetectionRow';

interface AnalysisListItemProps {
  analysis: Analysis;
  isExpanded: boolean;
  onToggle: () => void;
}

export function AnalysisListItem({ analysis, isExpanded, onToggle }: AnalysisListItemProps) {
  const hasNoDetections = analysis.detectionCount === 0;

  return (
    <li
      className={`mb-2.5 overflow-hidden rounded-md border border-gray-300 ${
        hasNoDetections ? 'bg-gray-100 opacity-60' : 'bg-gray-50'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between p-3 text-left transition hover:bg-gray-100"
      >
        <div className="flex-1">
          <div className="mb-1 break-words font-semibold text-gray-800">{analysis.filename}</div>
          <div className="mb-1 text-xs text-gray-500">{new Date(analysis.createdAt).toLocaleString()}</div>
          <div className={`text-[13px] font-medium ${hasNoDetections ? 'text-gray-400' : 'text-[#4CAF50]'}`}>
            {analysis.detectionCount} detection{analysis.detectionCount !== 1 ? 's' : ''}
          </div>
        </div>
        <span className="ml-2.5 text-xl text-gray-500">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && analysis.detections.length > 0 && (
        <ul className="border-t border-gray-300 bg-white">
          {analysis.detections.map((detection, index) => (
            <DetectionRow key={index} detection={detection} variant="compact" />
          ))}
        </ul>
      )}
    </li>
  );
}
