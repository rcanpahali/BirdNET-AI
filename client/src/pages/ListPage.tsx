import { Fragment, useState } from 'react';
import type { Analysis } from '@birdnet/types';
import { DetectionRow } from '../components/DetectionRow';
import { useAnalyses } from '../hooks/useAnalyses';

function formatLocation(analysis: Analysis): string {
  if (analysis.lat === null || analysis.lon === null) return '—';
  return `${analysis.lat.toFixed(4)}, ${analysis.lon.toFixed(4)}`;
}

export function ListPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId((current) => (current === id ? null : id));
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analysis history</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? 'Loading…'
              : `${analyses?.length ?? 0} analysis${(analyses?.length ?? 0) === 1 ? '' : 'es'} recorded`}
          </p>
        </header>

        {isLoading && <p className="p-8 text-center text-sm text-slate-400">Loading…</p>}

        {!isLoading && (analyses?.length ?? 0) === 0 && (
          <p className="p-8 text-center text-sm text-slate-400">No analyses yet</p>
        )}

        {!isLoading && analyses && analyses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Filename</th>
                  <th className="px-6 py-3">Recorded</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3">Detections</th>
                </tr>
              </thead>
              <tbody>
                {analyses.map((analysis) => {
                  const isExpanded = expandedId === analysis.id;
                  const hasNoDetections = analysis.detectionCount === 0;

                  return (
                    <Fragment key={analysis.id}>
                      <tr
                        onClick={() => toggleExpand(analysis.id)}
                        className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-3 font-medium text-slate-800">{analysis.filename}</td>
                        <td className="px-6 py-3 text-slate-500">{new Date(analysis.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-3 text-slate-500">{formatLocation(analysis)}</td>
                        <td
                          className={`px-6 py-3 font-medium ${hasNoDetections ? 'text-slate-400' : 'text-emerald-700'}`}
                        >
                          {analysis.detectionCount} detection{analysis.detectionCount !== 1 ? 's' : ''}
                        </td>
                      </tr>
                      {isExpanded && analysis.detections.length > 0 && (
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <td colSpan={4} className="px-6 py-3">
                            <ul className="list-none divide-y divide-slate-200">
                              {analysis.detections.map((detection, index) => (
                                <DetectionRow key={index} detection={detection} variant="compact" />
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListPage;
