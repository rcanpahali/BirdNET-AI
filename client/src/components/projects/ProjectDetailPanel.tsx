import { useTranslation } from 'react-i18next';
import { MapPin, Users } from 'lucide-react';
import type { Project } from '@birdnet/types';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';

export function ProjectDetailPanel({ project }: { project: Project }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1.5">
        <h3 className="font-semibold text-foreground">{project.name}</h3>
        <p className="text-muted-foreground">{project.description || t('common.noDescriptionProvided')}</p>
      </div>

      <Separator />

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5" /> {t('forms.project.locationLabel')}
        </p>
        <p className="text-foreground">{project.targetLocation || t('common.notSet')}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('projects.detail.recordingsLabel')}</p>
        <p className="text-foreground">{project.recordingCount}</p>
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Users className="size-3.5" /> {t('projects.detail.assignedUsers')}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="muted">{t('projects.detail.notIntroducedYet')}</Badge>
          <PlaceholderBadge label={t('common.comingSoon')} note={t('projects.detail.teamAssignmentNote')} />
        </div>
      </div>
    </div>
  );
}
