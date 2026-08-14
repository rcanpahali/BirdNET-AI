import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Map as MapIcon } from 'lucide-react';
import { EmptyState } from '../components/shared/EmptyState';
import { Skeleton } from '../components/ui/skeleton';
import { Checkbox } from '../components/ui/checkbox';
import { MapView } from '../components/map/MapView';
import type { LocatedAnalysis } from '../components/map/MapView';
import { RecordingFilters } from '../components/shared/RecordingFilters';
import type { RecordingFilterState } from '../components/shared/RecordingFilters';
import { RecordingDetailPanel } from '../components/recordings/RecordingDetailPanel';
import { RecordingHeaderActions } from '../components/recordings/RecordingHeaderActions';
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
  const { open, close, panel } = useContextPanel();
  const [searchParams] = useSearchParams();
  const focusId = useMemo(() => {
    const raw = searchParams.get('focus');
    return raw ? Number(raw) : null;
  }, [searchParams]);
  const [focusHandled, setFocusHandled] = useState(false);
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
  // Owned here (not MapView) so the checkboxes can live in this page's own filters
  // card instead of a separate floating box on the map itself.
  const [showMarkers, setShowMarkers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

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
      // Map link is disabled (not hidden) here -- this panel only ever opens from clicking a pin already on this page.
      headerAction: <RecordingHeaderActions analysis={analysis} onDeleted={close} mapLinkDisabled />,
    });
  };

  // Deep-link support for the Recordings page's "open on map" action -- fires once
  // `located` actually contains the target (may take a refetch to arrive), then never
  // again, so it doesn't keep re-opening the panel over whatever the user selects next.
  useEffect(() => {
    if (focusId === null || focusHandled) return;
    const match = located.find((a) => a.id === focusId);
    if (!match) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time deep-link handoff, guarded by focusHandled so it can't refire
    handleMarkerClick(match);
    setFocusHandled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleMarkerClick is recreated every render; the guards above already prevent re-firing
  }, [focusId, focusHandled, located]);

  return (
    // `relative` so the title/filters card and (once MapView mounts) its own zoom/layer
    // controls all float on top of a map that fills the entire page container -- there's
    // no separate header row above it any more, unlike every other page.
    <div className="relative h-full w-full overflow-hidden">
      {isLoading && <Skeleton className="h-full w-full rounded-none" />}

      {!isLoading && located.length === 0 && (
        <EmptyState icon={MapIcon} title={t('common.mapEmptyTitle')} description={t('map.noGpsDescription')} className="h-full" />
      )}

      {!isLoading && located.length > 0 && (
        <MapView
          analyses={filtered}
          onMarkerClick={handleMarkerClick}
          selectedId={highlightedId}
          focusId={focusId}
          showMarkers={showMarkers}
          showHeatmap={showHeatmap}
        />
      )}

      {/* `left-16` (not `left-3`, matching the layer/heatmap controls' `right-3` on the other
          corner) clears Leaflet's enlarged zoom control (see index.css), which sits at the
          map's top-left -- this card sits right beside it rather than on top of it. `z-30`
          (above MapView's own `z-20` floating controls) plus coming after `MapView` in DOM
          order both make sure this stacks above the map canvas regardless of MapView's
          internal `isolate` stacking context. */}
      <div className="absolute left-16 top-3 z-30 min-w-[220px] space-y-2 rounded-lg border border-border bg-card p-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <RecordingFilters filters={filters} onChange={handleFiltersChange} availableSpecies={distinctSpeciesNames(analyses ?? [])} />
          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
            <Checkbox checked={showMarkers} onCheckedChange={(checked) => setShowMarkers(Boolean(checked))} />
            {t('map.markersLabel')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-foreground">
            <Checkbox checked={showHeatmap} onCheckedChange={(checked) => setShowHeatmap(Boolean(checked))} />
            {t('map.heatmapLabel')}
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {isLoading ? t('map.loading') : t('map.locatedShown', { shown: filtered.length, count: located.length })}
        </p>
      </div>
    </div>
  );
}

export default MapPage;
