import { useTranslation } from 'react-i18next';
import type { AnalyzerResponse } from '@birdnet/types';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { ResultsPanel } from '../ResultsPanel';
import type { AudioSource } from '../audio/AudioPlayer';
import { getErrorMessage } from '../../api/client';
import { useDeleteAnalysis } from '../../hooks/useDeleteAnalysis';

interface AnalysisResultsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: AnalyzerResponse;
  /** Object URL of the file just analyzed, held in memory for this session only. */
  audioSource?: AudioSource | null;
  /** Lets a caller close anything else still showing this analysis (e.g. its detail side panel). */
  onDeleted?: (id: number) => void;
}

export function AnalysisResultsDialog({
  open,
  onOpenChange,
  results,
  audioSource = null,
  onDeleted,
}: AnalysisResultsDialogProps) {
  const { t } = useTranslation();
  const deleteAnalysis = useDeleteAnalysis();
  const { detection_count: detectionCount, filename, id } = results;

  const handleDelete = () => {
    if (id === undefined) return;
    deleteAnalysis.mutate(id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.(id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('results.title')}</DialogTitle>
          <DialogDescription>
            {t('results.foundPrefix')} <strong className="font-semibold text-foreground">{detectionCount}</strong>{' '}
            {t('results.detectionSuffix', { count: detectionCount })}{' '}
            <strong className="font-semibold text-foreground">{filename}</strong>
          </DialogDescription>
        </DialogHeader>

        <ResultsPanel results={results} audioSource={audioSource} />

        {detectionCount === 0 && id !== undefined ? (
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{t('results.keepOrDeletePrompt')}</p>
            {deleteAnalysis.isError && <p className="text-sm text-destructive">{getErrorMessage(deleteAnalysis.error)}</p>}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleteAnalysis.isPending}>
                {deleteAnalysis.isPending ? t('results.deleting') : t('results.delete')}
              </Button>
              <Button type="button" onClick={() => onOpenChange(false)}>
                {t('results.keep')}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <DialogFooter>
            <Button type="button" onClick={() => onOpenChange(false)}>
              {t('recordings.dialog.done')}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
