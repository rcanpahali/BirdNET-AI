import { MapPin, Pencil } from 'lucide-react';
import type { MockProject } from '../../lib/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { EditProjectDialog } from './EditProjectDialog';
import { cn } from '../../lib/utils';

interface ProjectCardProps {
  project: MockProject;
  active: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
}

export function ProjectCard({ project, active, onSelect, onViewDetails }: ProjectCardProps) {
  return (
    <Card
      role="group"
      aria-label={project.name}
      className={cn('flex flex-col transition-colors', active && 'border-primary/50 ring-1 ring-primary/30')}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{project.name}</CardTitle>
          {project.isSample && <PlaceholderBadge label="Sample" />}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="text-sm text-muted-foreground">{project.description}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" /> {project.targetLocation}
        </p>
        <div className="mt-auto flex gap-2 pt-2">
          <Button size="sm" variant={active ? 'secondary' : 'default'} onClick={onSelect} disabled={active} className="flex-1">
            {active ? 'Currently active' : 'Switch to project'}
          </Button>
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            Details
          </Button>
          <EditProjectDialog
            project={project}
            trigger={
              <Button size="sm" variant="outline" aria-label={`Edit ${project.name}`}>
                <Pencil />
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
