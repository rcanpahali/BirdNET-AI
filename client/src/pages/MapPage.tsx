import { useMemo, useState } from 'react';
import { Map as MapIcon } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { MapView } from '../components/map/MapView';
import type { LocatedAnalysis } from '../components/map/MapView';
import { MapFilters } from '../components/map/MapFilters';
import type { MapFilterState } from '../components/map/MapFilters';
import { RecordingDetailPanel } from '../components/recordings/RecordingDetailPanel';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { DEFAULT_PROJECT_ID } from '../lib/mockData';
import { distinctSpeciesNames } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';

export function MapPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const { open } = useContextPanel();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filters, setFilters] = useState<MapFilterState>({ dateRange: 'all', species: [], projectId: DEFAULT_PROJECT_ID });
  // Computed only from the onChange handler below (an event, not render) --
  // `Date.now()` may not be called during render.
  const [cutoff, setCutoff] = useState<number | null>(null);

  const handleFiltersChange = (next: MapFilterState) => {
    if (next.dateRange !== filters.dateRange) setCutoff(computeDateRangeCutoff(next.dateRange));
    setFilters(next);
  };

  const located = useMemo<LocatedAnalysis[]>(
    () => (analyses ?? []).filter((a): a is LocatedAnalysis => a.lat !== null && a.lon !== null),
    [analyses]
  );

  const filtered = useMemo(() => {
    if (filters.projectId !== DEFAULT_PROJECT_ID) return [];

    return located.filter((analysis) => {
      if (cutoff !== null && new Date(analysis.createdAt).getTime() < cutoff) return false;
      if (filters.species.length > 0) {
        const names = new Set(analysis.detections.map((d) => d.common_name));
        if (!filters.species.some((s) => names.has(s))) return false;
      }
      return true;
    });
  }, [located, filters, cutoff]);

  const handleMarkerClick = (analysis: LocatedAnalysis) => {
    setSelectedId(analysis.id);
    open({
      title: analysis.filename,
      description: new Date(analysis.createdAt).toLocaleString(),
      content: <RecordingDetailPanel analysis={analysis} />,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title="Interactive Map"
        description={
          isLoading
            ? 'Loading recording locations…'
            : `${filtered.length} of ${located.length} located recording${located.length !== 1 ? 's' : ''} shown`
        }
      />

      <MapFilters filters={filters} onChange={handleFiltersChange} availableSpecies={distinctSpeciesNames(analyses ?? [])} />

      {isLoading && <Skeleton className="h-[65vh] w-full" />}

      {!isLoading && located.length === 0 && (
        <EmptyState
          icon={MapIcon}
          title="Select a map location to begin."
          description="No recordings have GPS coordinates yet. Locations are captured automatically when you record or upload with location access enabled."
          className="flex-1"
        />
      )}

      {!isLoading && located.length > 0 && (
        <div className="min-h-[65vh] flex-1 overflow-hidden rounded-xl border border-border shadow-sm">
          <MapView analyses={filtered} onMarkerClick={handleMarkerClick} selectedId={selectedId} />
        </div>
      )}
    </div>
  );
}

export default MapPage;
