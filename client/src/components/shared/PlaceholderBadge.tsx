import { useTranslation } from 'react-i18next';
import { FlaskConical } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

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
export function PlaceholderBadge({ label, note }: PlaceholderBadgeProps) {
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="placeholder">
          <FlaskConical />
          {label ?? t('common.sampleData')}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{note ?? t('common.placeholderNoteDefault')}</TooltipContent>
    </Tooltip>
  );
}
