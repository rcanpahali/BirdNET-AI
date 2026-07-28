import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Map as MapIcon } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { MapView } from '../components/map/MapView';
import type { LocatedAnalysis } from '../components/map/MapView';
import { RecordingFilters } from '../components/shared/RecordingFilters';
import type { RecordingFilterState } from '../components/shared/RecordingFilters';
import { RecordingDetailPanel } from '../components/recordings/RecordingDetailPanel';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatDateTime } from '../lib/format';
import { distinctSpeciesNames } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';

export function MapPage() {
  const { t } = useTranslation();
  const { selectedProject } = useProjectContext();
  const { data: analyses, isLoading } = useAnalyses(selectedProject?.id);
  const { open, panel } = useContextPanel();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The panel can close without MapPage knowing why (its own "X" button, or
  // AppShell closing it on navigation) -- derive the highlighted pin from
  // whether the panel is actually open, rather than tracking it separately,
  // so a pin never stays highlighted with nothing backing it.
  const highlightedId = panel ? selectedId : null;
  const [filters, setFilters] = useState<RecordingFilterState>({ dateRange: 'all', species: [] });
  // Computed only from the onChange handler below (an event, not render) --
  // `Date.now()` may not be called during render.
  const [cutoff, setCutoff] = useState<number | null>(null);

  const handleFiltersChange = (next: RecordingFilterState) => {
    if (next.dateRange !== filters.dateRange) setCutoff(computeDateRangeCutoff(next.dateRange));
    setFilters(next);
  };

  const located = useMemo<LocatedAnalysis[]>(
    () => (analyses ?? []).filter((a): a is LocatedAnalysis => a.lat !== null && a.lon !== null),
    [analyses]
  );

  const filtered = useMemo(() => {
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
      title: t('recordings.label', { id: analysis.id }),
      description: formatDateTime(analysis.createdAt),
      content: <RecordingDetailPanel analysis={analysis} />,
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <PageHeader
        title={t('nav.map')}
        description={isLoading ? t('map.loading') : t('map.locatedShown', { shown: filtered.length, count: located.length })}
      />

      <RecordingFilters filters={filters} onChange={handleFiltersChange} availableSpecies={distinctSpeciesNames(analyses ?? [])} />

      {isLoading && <Skeleton className="h-[65vh] w-full" />}

      {!isLoading && located.length === 0 && (
        <EmptyState
          icon={MapIcon}
          title={t('common.mapEmptyTitle')}
          description={t('map.noGpsDescription')}
          className="flex-1"
        />
      )}

      {!isLoading && located.length > 0 && (
        // `h-[65vh]` (not `min-h`/`flex-1`) -- Leaflet's container is `height: 100%`, which
        // only resolves against a parent with an explicit height. A min-height-only parent
        // leaves it height:auto, which collapses to 0 since Leaflet's panes are absolutely
        // positioned (no intrinsic height), so the map renders with loaded tiles but zero
        // visible height.
        <div className="h-[65vh] overflow-hidden rounded-xl border border-border shadow-sm">
          <MapView analyses={filtered} onMarkerClick={handleMarkerClick} selectedId={highlightedId} />
        </div>
      )}
    </div>
  );
}

export default MapPage;
