import { useTranslation } from 'react-i18next';
import { MapPin, Pencil, Trash2 } from 'lucide-react';
import type { Project } from '@birdnet/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { EditProjectDialog } from './EditProjectDialog';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { cn } from '../../lib/utils';

interface ProjectCardProps {
  project: Project;
  active: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  onDeleted: () => void;
}

export function ProjectCard({ project, active, onSelect, onViewDetails, onDeleted }: ProjectCardProps) {
  const { t } = useTranslation();
  return (
    <Card
      role="group"
      aria-label={project.name}
      className={cn('flex flex-col transition-colors', active && 'border-primary/50 ring-1 ring-primary/30')}
    >
      <CardHeader className="pb-2">
        <CardTitle>{project.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{project.description || t('common.noDescriptionProvided')}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> {project.targetLocation || t('common.notSet')}
        </p>
        <p className="text-xs text-muted-foreground">{t('common.recordingCount', { count: project.recordingCount })}</p>
        <div className="mt-auto flex gap-2 pt-2">
          <Button size="sm" variant={active ? 'secondary' : 'default'} onClick={onSelect} disabled={active} className="flex-1">
            {active ? t('projects.card.currentlyActive') : t('projects.card.switchToProject')}
          </Button>
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            {t('projects.card.details')}
          </Button>
          <EditProjectDialog
            project={project}
            trigger={
              <Button size="sm" variant="outline" aria-label={t('projects.card.editAria', { name: project.name })}>
                <Pencil />
              </Button>
            }
          />
          <DeleteProjectDialog
            project={project}
            onDeleted={onDeleted}
            trigger={
              <Button size="sm" variant="outline" aria-label={t('projects.card.deleteAria', { name: project.name })}>
                <Trash2 />
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
