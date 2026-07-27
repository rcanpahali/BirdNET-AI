import { useState } from 'react';
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
import { useAnalyses } from '../hooks/useAnalyses';
import { useContextPanel } from '../context/ContextPanelContext';
import { useNewRecordingDialog } from '../context/NewRecordingDialogContext';

type ViewMode = 'table' | 'card';

export function RecordingsPage() {
  const { data: analyses, isLoading } = useAnalyses();
  const [view, setView] = useState<ViewMode>('table');
  const [justAnalyzed, setJustAnalyzed] = useState<{ filename: string; url: string } | null>(null);
  const { open } = useContextPanel();
  // Any "New recording" button anywhere in the app (this page or another)
  // opens this same dialog -- it only ever renders here.
  const { open: newRecordingOpen, setOpen: setNewRecordingOpen } = useNewRecordingDialog();

  const showDetails = (analysis: Analysis) => {
    const audioSource =
      justAnalyzed && justAnalyzed.filename === analysis.filename ? { url: justAnalyzed.url, filename: analysis.filename } : null;

    open({
      title: analysis.filename,
      description: new Date(analysis.createdAt).toLocaleString(),
      content: <RecordingDetailPanel analysis={analysis} audioSource={audioSource} />,
    });
  };

  const hasRecordings = (analyses?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recordings"
        description="Every audio recording analyzed for this project, in table or card view."
        actions={
          <>
            <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as ViewMode)}>
              <ToggleGroupItem value="table" aria-label="Table view">
                <TableIcon />
              </ToggleGroupItem>
              <ToggleGroupItem value="card" aria-label="Card view">
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
        onAnalyzed={(filename, url) => setJustAnalyzed({ filename, url })}
      />

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
          title="No recordings available."
          description="Upload your first audio recording to see it analyzed here."
          action={<NewRecordingButton />}
        />
      )}

      {!isLoading &&
        hasRecordings &&
        (view === 'table' ? (
          <RecordingsTable analyses={analyses!} onSelect={showDetails} />
        ) : (
          <RecordingsCardGrid analyses={analyses!} onSelect={showDetails} />
        ))}
    </div>
  );
}

export default RecordingsPage;
