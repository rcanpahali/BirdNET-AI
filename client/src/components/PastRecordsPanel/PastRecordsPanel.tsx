import { useState } from 'react';
import { useAnalyses } from '../../hooks/useAnalyses';
import { AnalysisListItem } from './AnalysisListItem';

export function PastRecordsPanel() {
  const { data: analyses, isLoading } = useAnalyses();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="fixed top-0 right-0 z-50 h-screen w-[400px] overflow-hidden bg-white shadow-[-2px_0_8px_rgba(0,0,0,0.1)]">
      <div className="h-full overflow-y-auto p-5">
        <h2 className="mb-5 border-b-2 border-[#4CAF50] pb-2.5 text-xl text-gray-800">Analysis History</h2>

        {isLoading && <p className="p-5 text-center italic text-gray-500">Loading...</p>}

        {!isLoading && (analyses?.length ?? 0) === 0 && (
          <p className="p-5 text-center italic text-gray-500">No analyses yet</p>
        )}

        {!isLoading && analyses && analyses.length > 0 && (
          <ul className="list-none">
            {analyses.map((analysis) => (
              <AnalysisListItem
                key={analysis.id}
                analysis={analysis}
                isExpanded={expandedId === analysis.id}
                onToggle={() => toggleExpand(analysis.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
