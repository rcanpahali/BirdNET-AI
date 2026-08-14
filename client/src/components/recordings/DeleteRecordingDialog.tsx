import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import type { Analysis } from '@birdnet/types';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { RecordingSummary } from './RecordingSummary';
import { useDeleteAnalysis } from '../../hooks/useDeleteAnalysis';
import { getErrorMessage } from '../../api/client';

interface DeleteRecordingDialogProps {
  analysis: Analysis;
  trigger: ReactNode;
  /** Called after a successful delete, e.g. to close a detail panel showing this recording. */
  onDeleted?: () => void;
}

export function DeleteRecordingDialog({ analysis, trigger, onDeleted }: DeleteRecordingDialogProps) {
  const { t } = useTranslation();
  const deleteAnalysis = useDeleteAnalysis();
  const [open, setOpen] = useState(false);
  const label = t('recordings.label', { id: analysis.id });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) deleteAnalysis.reset();
  };

  const handleConfirm = () => {
    deleteAnalysis.mutate(analysis.id, {
      onSuccess: () => {
        setOpen(false);
        onDeleted?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4.5" /> {t('recordings.deleteDialog.title', { label })}
          </DialogTitle>
          <DialogDescription>{t('recordings.deleteDialog.description')}</DialogDescription>
        </DialogHeader>

        <Separator />
        <RecordingSummary analysis={analysis} />

        {deleteAnalysis.isError && <p className="text-sm text-destructive">{getErrorMessage(deleteAnalysis.error)}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteAnalysis.isPending}>
            {deleteAnalysis.isPending ? t('recordings.deleteDialog.deleting') : t('recordings.deleteDialog.deleteButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
