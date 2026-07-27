import { useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Progress } from '../ui/progress';
import { UploadForm } from '../upload-form/UploadForm';
import type { UploadFormValues } from '../upload-form/UploadForm';
import { ResultsPanel } from '../ResultsPanel';
import { getErrorMessage } from '../../api/client';
import { useAnalyzeMutation } from '../../hooks/useAnalyzeMutation';

interface NewRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lets the Recordings page correlate the freshly analyzed row with the audio still held in memory. */
  onAnalyzed?: (filename: string, audioUrl: string) => void;
}

/**
 * The dialog itself has no trigger button -- it's meant to be mounted once
 * (on the Recordings page) and opened from anywhere via `NewRecordingButton`,
 * which navigates here first if needed. See NewRecordingDialogContext.
 */
export function NewRecordingDialog({ open, onOpenChange, onAnalyzed }: NewRecordingDialogProps) {
  const [lastFormData, setLastFormData] = useState<FormData | null>(null);
  const mutation = useAnalyzeMutation();

  const buildFormData = (values: UploadFormValues): FormData | null => {
    if (!values.file) return null;
    const formData = new FormData();
    formData.append('file', values.file);
    if (values.lat) formData.append('lat', values.lat);
    if (values.lon) formData.append('lon', values.lon);
    const parsedMinConf = Number.parseFloat(values.minConf);
    formData.append('min_conf', String(Number.isFinite(parsedMinConf) ? parsedMinConf : 0.25));
    return formData;
  };

  const handleSubmit = (values: UploadFormValues) => {
    const formData = buildFormData(values);
    if (!formData || !values.file) return;

    setLastFormData(formData);
    const audioUrl = URL.createObjectURL(values.file);
    const filename = values.file.name;

    mutation.mutate(formData, {
      onSuccess: () => onAnalyzed?.(filename, audioUrl),
    });
  };

  const handleRetry = () => {
    if (lastFormData) mutation.mutate(lastFormData);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (!next) mutation.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New recording</DialogTitle>
          <DialogDescription>Record audio directly, or drag and drop a file to analyze it with BirdNET.</DialogDescription>
        </DialogHeader>

        {!mutation.isSuccess && (
          <UploadForm loading={mutation.isPending} onSubmit={handleSubmit} onFileSelected={() => mutation.reset()} />
        )}

        {mutation.isPending && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Uploading…</span>
              <span>{mutation.uploadProgress ?? 0}%</span>
            </div>
            <Progress value={mutation.uploadProgress ?? 0} />
          </div>
        )}

        {mutation.isError && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <span>
              <strong className="font-semibold">Upload failed:</strong> {getErrorMessage(mutation.error)}
            </span>
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}

        {mutation.isSuccess && mutation.data && (
          <div className="space-y-4">
            <ResultsPanel results={mutation.data} />
            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
