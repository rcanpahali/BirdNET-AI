import { useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TriangleAlert } from 'lucide-react';
import type { Project } from '@birdnet/types';
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
import { useDeleteProject } from '../../hooks/useProjects';
import { getErrorMessage } from '../../api/client';

interface DeleteProjectDialogProps {
  project: Project;
  trigger: ReactNode;
  /** Called after a successful delete, e.g. to switch the active project. */
  onDeleted?: () => void;
}

export function DeleteProjectDialog({ project, trigger, onDeleted }: DeleteProjectDialogProps) {
  const { t } = useTranslation();
  const deleteProject = useDeleteProject();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) deleteProject.reset();
  };

  const handleConfirm = () => {
    deleteProject.mutate(project.id, {
      onSuccess: () => {
        setOpen(false);
        onDeleted?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4.5" /> {t('projects.deleteDialog.title', { name: project.name })}
          </DialogTitle>
          <DialogDescription>
            {project.recordingCount > 0 ? (
              <>
                {t('projects.deleteDialog.confirmPrefix')}{' '}
                <strong className="font-semibold text-foreground">{project.recordingCount}</strong>{' '}
                {t('projects.deleteDialog.confirmSuffix', { count: project.recordingCount })}
              </>
            ) : (
              t('projects.deleteDialog.confirmEmpty')
            )}
          </DialogDescription>
        </DialogHeader>
        {deleteProject.isError && <p className="text-sm text-destructive">{getErrorMessage(deleteProject.error)}</p>}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button type="button" variant="destructive" onClick={handleConfirm} disabled={deleteProject.isPending}>
            {deleteProject.isPending ? t('projects.deleteDialog.deleting') : t('projects.deleteDialog.deleteProject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
