import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { UploadForm } from '../upload-form/UploadForm';
import type { UploadFormValues } from '../upload-form/UploadForm';
import { AnalysisResultsDialog } from './AnalysisResultsDialog';
import type { AudioSource } from '../audio/AudioPlayer';
import { getErrorMessage } from '../../api/client';
import { useAnalyzeMutation } from '../../hooks/useAnalyzeMutation';
import { useProjectContext } from '../../context/ProjectContext';

interface NewRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lets the Recordings page correlate the freshly analyzed row with the audio still held in memory. */
  onAnalyzed?: (id: number, filename: string, audioUrl: string) => void;
  /** Lets the Recordings page close the detail side panel if it's showing the analysis that was just deleted. */
  onDeleted?: (id: number) => void;
}

/**
 * The dialog itself has no trigger button -- it's meant to be mounted once
 * (on the Recordings page) and opened from anywhere via `NewRecordingButton`,
 * which navigates here first if needed. See NewRecordingDialogContext.
 *
 * A successful analysis closes this dialog and opens `AnalysisResultsDialog`
 * as a separate modal, rather than swapping this dialog's own content --
 * `mutation.data` stays populated (not reset) while that dialog is up so its
 * closing animation and Delete/Keep flow have something to act on.
 */
export function NewRecordingDialog({ open, onOpenChange, onAnalyzed, onDeleted }: NewRecordingDialogProps) {
  const { t } = useTranslation();
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const mutation = useAnalyzeMutation();
  const { selectedProject } = useProjectContext();

  const buildFormData = (values: UploadFormValues): FormData | null => {
    if (!values.file || !selectedProject) return null;
    const formData = new FormData();
    formData.append('file', values.file);
    formData.append('project_id', String(selectedProject.id));
    if (values.lat) formData.append('lat', values.lat);
    if (values.lon) formData.append('lon', values.lon);
    const parsedMinConf = Number.parseFloat(values.minConf);
    formData.append('min_conf', String(Number.isFinite(parsedMinConf) ? parsedMinConf : 0.25));
    return formData;
  };

  // Keyed off the persisted `id` (not `filename`) so the Recordings page can find the exact
  // row that was just created -- filenames can collide across analyses (e.g. re-uploading
  // the same file), which previously made the auto-focus effect latch onto the wrong row.
  const handleAnalysisSuccess = (id: number | undefined, filename: string, audioUrl: string) => {
    if (id !== undefined) onAnalyzed?.(id, filename, audioUrl);
    onOpenChange(false);
    setResultsOpen(true);
  };

  const handleSubmit = (values: UploadFormValues) => {
    const formData = buildFormData(values);
    if (!formData || !values.file) return;

    setLastFormData(formData);
    const audioUrl = URL.createObjectURL(values.file);
    const filename = values.file.name;
    setAudioSource({ url: audioUrl, filename });

    mutation.mutate(formData, { onSuccess: (data) => handleAnalysisSuccess(data.id, filename, audioUrl) });
  };

  const handleRetry = () => {
    if (!lastFormData || !audioSource) return;
    mutation.mutate(lastFormData, {
      onSuccess: (data) => handleAnalysisSuccess(data.id, audioSource.filename, audioSource.url),
    });
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) mutation.reset();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('recordings.new')}</DialogTitle>
            <DialogDescription>{t('recordings.dialog.description')}</DialogDescription>
          </DialogHeader>

          <UploadForm loading={mutation.isPending} onSubmit={handleSubmit} onFileSelected={() => mutation.reset()} />

          {mutation.isPending && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('recordings.dialog.uploading')}</span>
                <span>{mutation.uploadProgress ?? 0}%</span>
              </div>
              <Progress value={mutation.uploadProgress ?? 0} />
            </div>
          )}

          {mutation.isError && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span>
                <strong className="font-semibold">{t('recordings.dialog.uploadFailed')}</strong> {getErrorMessage(mutation.error)}
              </span>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                {t('recordings.dialog.retry')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {mutation.data && (
        <AnalysisResultsDialog
          open={resultsOpen}
          onOpenChange={setResultsOpen}
          results={mutation.data}
          audioSource={audioSource}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
