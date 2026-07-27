import { MapPin, Users } from 'lucide-react';
import type { MockProject } from '../../lib/mockData';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';

export function ProjectDetailPanel({ project }: { project: MockProject }) {
  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{project.name}</h3>
          {project.isSample && <PlaceholderBadge label="Sample project" />}
        </div>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <Separator />

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5" /> Target location
        </p>
        <p className="text-foreground">{project.targetLocation}</p>
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Users className="size-3.5" /> Assigned users
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="muted">Not introduced yet</Badge>
          <PlaceholderBadge label="Coming soon" note="Team assignment isn't implemented -- projects have no user model yet." />
        </div>
      </div>
    </div>
  );
}
