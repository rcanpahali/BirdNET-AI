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
import { RecordingHeaderActions } from '../components/recordings/RecordingHeaderActions';
import { RecordingFilters } from '../components/shared/RecordingFilters';
import type { RecordingFilterState } from '../components/shared/RecordingFilters';
import { Pagination } from '../components/shared/Pagination';
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useNewRecordingDialog } from '../context/NewRecordingDialogContext';
import { useProjectContext } from '../context/ProjectContext';
import { formatDateTime } from '../lib/format';
import { distinctSpeciesNames } from '../lib/analytics';
import { computeDateRangeCutoff } from '../lib/dateRange';
import { DEFAULT_RECORDING_SORT, sortAnalyses } from '../lib/sortRecordings';
import type { RecordingSort } from '../lib/sortRecordings';

type ViewMode = 'table' | 'card';

const PAGE_SIZE = 15;

export function RecordingsPage() {
  const { t } = useTranslation();
  const { selectedProject } = useProjectContext();
  const { data: analyses, isLoading } = useAnalyses(selectedProject?.id);
  const [view, setView] = useState<ViewMode>('table');
  const [justAnalyzed, setJustAnalyzed] = useState<{ id: number; filename: string; url: string } | null>(null);
  // Set alongside `justAnalyzed`, cleared once the newly analyzed row is found and
  // focused -- lets the effect below pick up the row as soon as the `analyses`
  // refetch (triggered by the mutation) actually contains it, however long that takes.
  const [autoFocusPending, setAutoFocusPending] = useState(false);
  const { open, close, panel } = useContextPanel();
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
  const [sort, setSort] = useState<RecordingSort>(DEFAULT_RECORDING_SORT);
  const [page, setPage] = useState(1);

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

  const sorted = useMemo(() => sortAnalyses(filtered, sort), [filtered, sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  // Derived, not synced via an effect -- a filter/sort change that shrinks the
  // result set below the page the user was on just reads as "page 1" again,
  // instead of needing a reset written at every place `sorted` can shrink.
  const currentPage = Math.min(page, pageCount);
  const paged = useMemo(() => sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE), [sorted, currentPage]);

  const showDetails = (analysis: Analysis) => {
    const audioSource = justAnalyzed && justAnalyzed.id === analysis.id ? { url: justAnalyzed.url, filename: analysis.filename } : null;

    setSelectedId(analysis.id);
    open({
      title: t('recordings.label', { id: analysis.id }),
      description: formatDateTime(analysis.createdAt),
      content: <RecordingDetailPanel analysis={analysis} audioSource={audioSource} />,
      headerAction: <RecordingHeaderActions analysis={analysis} onDeleted={close} />,
    });
  };

  // Deleting a row/card whose detail panel happens to be open would otherwise
  // leave the panel showing a recording that no longer exists.
  const handleRowDeleted = (id: number) => {
    if (selectedId === id) close();
  };

  // Runs once the dialog is closed after a successful analysis -- may fire
  // immediately (if the `analyses` refetch already landed while the dialog's
  // results were showing) or wait for `analyses` to update, since invalidating
  // the query on mutation success doesn't guarantee the refetch has resolved yet.
  // Matched by `id`, not `filename` -- two analyses can share a filename (e.g.
  // re-uploading the same file), and matching by name could latch onto a
  // pre-existing row before the refetch bringing in the real new one lands.
  useEffect(() => {
    if (newRecordingOpen || !autoFocusPending || !justAnalyzed) return;
    const match = analyses?.find((a) => a.id === justAnalyzed.id);
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
        onAnalyzed={(id, filename, url) => {
          setJustAnalyzed({ id, filename, url });
          setAutoFocusPending(true);
        }}
        onDeleted={(id) => {
          if (selectedId === id) close();
          setAutoFocusPending(false);
          setJustAnalyzed(null);
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
          <RecordingsTable
            analyses={paged}
            onSelect={showDetails}
            selectedId={highlightedId}
            sort={sort}
            onSortChange={setSort}
            onDeleted={handleRowDeleted}
          />
        ) : (
          <RecordingsCardGrid analyses={paged} onSelect={showDetails} selectedId={highlightedId} onDeleted={handleRowDeleted} />
        ))}

      {!isLoading && hasFilteredRecordings && pageCount > 1 && (
        <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
      )}
    </div>
  );
}

export default RecordingsPage;
