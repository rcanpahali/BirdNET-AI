import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Analysis } from '@birdnet/types';
import { AudioLines, LayoutGrid, TableIcon } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { EmptyState } from '../components/shared/EmptyState';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { Skeleton } from '../components/ui/skeleton';
import { NewRecordingDialog } from '../components/recordings/NewRecordingDialog';
import { NewRecordingButton } from '../components/recordings/NewRecordingButton';
import { RecordingsTable } from '../components/recordings/RecordingsTable';
import { RecordingsCardGrid } from '../components/recordings/RecordingsCardGrid';
import { RecordingDetailPanel } from '../components/recordings/RecordingDetailPanel';
import { RecordingFilters } from '../components/shared/RecordingFilters';
import type { RecordingFilterState } from '../components/shared/RecordingFilters';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useNewRecordingDialog } from '../context/NewRecordingDialogContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatDateTime } from '../lib/format';
import { distinctSpeciesNames } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';

type ViewMode = 'table' | 'card';

export function RecordingsPage() {
  const { t } = useTranslation();
  const { selectedProject } = useProjectContext();
  const { data: analyses, isLoading } = useAnalyses(selectedProject?.id);
  const [view, setView] = useState<ViewMode>('table');
  const [justAnalyzed, setJustAnalyzed] = useState<{ filename: string; url: string } | null>(null);
  // Set alongside `justAnalyzed`, cleared once the newly analyzed row is found and
  // focused -- lets the effect below pick up the row as soon as the `analyses`
  // refetch (triggered by the mutation) actually contains it, however long that takes.
  const [autoFocusPending, setAutoFocusPending] = useState(false);
  const { open, panel } = useContextPanel();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // The panel can close without RecordingsPage knowing why (its own "X" button, or
  // AppShell closing it on navigation) -- derive the highlighted row from whether
  // the panel is actually open, rather than tracking it separately, so a row never
  // stays highlighted with nothing backing it. Mirrors MapPage's pin highlighting.
  const highlightedId = panel ? selectedId : null;
  // Any "New recording" button anywhere in the app (this page or another)
  // opens this same dialog -- it only ever renders here.
  const { open: newRecordingOpen, setOpen: setNewRecordingOpen } = useNewRecordingDialog();

  const [filters, setFilters] = useState<RecordingFilterState>({ dateRange: 'all', species: [] });
  // Computed only from the onChange handler below (an event, not render) --
  // `Date.now()` may not be called during render.
  const [cutoff, setCutoff] = useState<number | null>(null);

  const handleFiltersChange = (next: RecordingFilterState) => {
    if (next.dateRange !== filters.dateRange) setCutoff(computeDateRangeCutoff(next.dateRange));
    setFilters(next);
  };

  const filtered = useMemo(() => {
    return (analyses ?? []).filter((analysis) => {
      if (cutoff !== null && new Date(analysis.createdAt).getTime() < cutoff) return false;
      if (filters.species.length > 0) {
        const names = new Set(analysis.detections.map((d) => d.common_name));
        if (!filters.species.some((s) => names.has(s))) return false;
      }
      return true;
    });
  }, [analyses, filters, cutoff]);

  const showDetails = (analysis: Analysis) => {
    const audioSource =
      justAnalyzed && justAnalyzed.filename === analysis.filename ? { url: justAnalyzed.url, filename: analysis.filename } : null;

    setSelectedId(analysis.id);
    open({
      title: t('recordings.label', { id: analysis.id }),
      description: formatDateTime(analysis.createdAt),
      content: <RecordingDetailPanel analysis={analysis} audioSource={audioSource} />,
    });
  };

  // Runs once the dialog is closed after a successful analysis -- may fire
  // immediately (if the `analyses` refetch already landed while the dialog's
  // results were showing) or wait for `analyses` to update, since invalidating
  // the query on mutation success doesn't guarantee the refetch has resolved yet.
  useEffect(() => {
    if (newRecordingOpen || !autoFocusPending || !justAnalyzed) return;
    const match = analyses?.find((a) => a.filename === justAnalyzed.filename);
    if (!match) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- waiting on an external system (the `analyses` query cache catching up with the mutation) to converge, not deriving local state; the guards above make this fire at most once per successful analysis
    showDetails(match);
    setAutoFocusPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `showDetails` is recreated every render; the guards above already prevent re-firing once handled
  }, [newRecordingOpen, analyses, autoFocusPending, justAnalyzed]);

  const hasRecordings = (analyses?.length ?? 0) > 0;
  const hasFilteredRecordings = filtered.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('recordings.page.title')}
        description={t('recordings.page.description')}
        actions={
          <>
            <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as ViewMode)}>
              <ToggleGroupItem value="table" aria-label={t('recordings.page.tableViewLabel')}>
                <TableIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label={t('recordings.page.cardViewLabel')}>
                <LayoutGrid />
              </ToggleGroupItem>
            </ToggleGroup>
            <NewRecordingButton />
          </>
        }
      />

      <NewRecordingDialog
        open={newRecordingOpen}
        onOpenChange={setNewRecordingOpen}
        onAnalyzed={(filename, url) => {
          setJustAnalyzed({ filename, url });
          setAutoFocusPending(true);
        }}
      />

      {!isLoading && hasRecordings && (
        <RecordingFilters filters={filters} onChange={handleFiltersChange} availableSpecies={distinctSpeciesNames(analyses ?? [])} />
      )}

      {isLoading && (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !hasRecordings && (
        <EmptyState
          icon={AudioLines}
          title={t('common.noRecordingsAvailable')}
          description={t('recordings.page.emptyDescription')}
          action={<NewRecordingButton />}
        />
      )}

      {!isLoading && hasRecordings && !hasFilteredRecordings && (
        <EmptyState icon={AudioLines} title={t('recordings.page.noFilterResults')} />
      )}

      {!isLoading &&
        hasFilteredRecordings &&
        (view === 'table' ? (
          <RecordingsTable analyses={filtered} onSelect={showDetails} selectedId={highlightedId} />
        ) : (
          <RecordingsCardGrid analyses={filtered} onSelect={showDetails} selectedId={highlightedId} />
        ))}
    </div>
  );
}

export default RecordingsPage;
