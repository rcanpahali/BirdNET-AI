import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useUpdateProject } from '../../hooks/useProjects';
import { getErrorMessage } from '../../api/client';

interface EditProjectDialogProps {
  project: Project;
  trigger: ReactNode;
}

export function EditProjectDialog({ project, trigger }: EditProjectDialogProps) {
  const { t } = useTranslation();
  const updateProject = useUpdateProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [targetLocation, setTargetLocation] = useState(project.targetLocation ?? '');
  const nameId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setName(project.name);
      setDescription(project.description ?? '');
      setTargetLocation(project.targetLocation ?? '');
      updateProject.reset();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    updateProject.mutate(
      {
        id: project.id,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          targetLocation: targetLocation.trim() || undefined,
        },
      },
      { onSuccess: () => setOpen(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.editDialog.title')}</DialogTitle>
          <DialogDescription>{t('projects.editDialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>{t('forms.project.nameLabel')}</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('forms.project.namePlaceholder')}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={locationId}>{t('forms.project.locationLabel')}</Label>
            <Input
              id={locationId}
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder={t('forms.project.locationPlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={descriptionId}>{t('forms.project.descriptionLabel')}</Label>
            <Input
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('forms.project.descriptionPlaceholder')}
            />
          </div>
          {updateProject.isError && (
            <p className="text-sm text-destructive">{getErrorMessage(updateProject.error)}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || updateProject.isPending}>
              {updateProject.isPending ? t('common.saving') : t('projects.editDialog.saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
