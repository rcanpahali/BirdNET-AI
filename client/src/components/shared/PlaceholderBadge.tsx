import { FlaskConical } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { PLACEHOLDER_NOTE } from '../../lib/mockData';

interface PlaceholderBadgeProps {
  label?: string;
  note?: string;
}

/**
 * Marks a value, card, or section as sample/placeholder data so it's
 * obvious at a glance which parts of the UI are waiting on a real backend
 * feature. Always pair real and placeholder metrics with this badge rather
 * than letting them look identical.
 */
export function PlaceholderBadge({ label = 'Sample data', note = PLACEHOLDER_NOTE }: PlaceholderBadgeProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="placeholder">
          <FlaskConical />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{note}</TooltipContent>
    </Tooltip>
  );
}
