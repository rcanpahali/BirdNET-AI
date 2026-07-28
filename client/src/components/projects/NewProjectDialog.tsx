import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useProjectContext } from '../../context/ProjectContext';
import { useCreateProject } from '../../hooks/useProjects';
import { getErrorMessage } from '../../api/client';

interface NewProjectDialogProps {
  trigger: ReactNode;
}

export function NewProjectDialog({ trigger }: NewProjectDialogProps) {
  const { t } = useTranslation();
  const { selectProject } = useProjectContext();
  const createProject = useCreateProject();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const nameId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) createProject.reset();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    createProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        targetLocation: targetLocation.trim() || undefined,
      },
      {
        onSuccess: (project) => {
          selectProject(project.id);
          setName('');
          setDescription('');
          setTargetLocation('');
          setOpen(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('projects.newDialog.title')}</DialogTitle>
          <DialogDescription>{t('projects.newDialog.description')}</DialogDescription>
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
          {createProject.isError && (
            <p className="text-sm text-destructive">{getErrorMessage(createProject.error)}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={!name.trim() || createProject.isPending}>
              {createProject.isPending ? t('projects.newDialog.creating') : t('projects.newDialog.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
