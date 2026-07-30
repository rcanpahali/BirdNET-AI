import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Analysis } from '@birdnet/types';
import { Map as MapIcon, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DeleteRecordingDialog } from './DeleteRecordingDialog';
import { cn } from '../../lib/utils';

interface RecordingHeaderActionsProps {
  analysis: Analysis;
  /** Called after a successful delete, e.g. to close the detail panel showing this recording. */
  onDeleted?: () => void;
  /** Disables (rather than hides) the "view on map" link -- e.g. when this recording's panel is already open on the map itself. */
  mapLinkDisabled?: boolean;
}

/** Delete + "view on map" actions shared by every place a recording's detail panel can be opened. */
export function RecordingHeaderActions({ analysis, onDeleted, mapLinkDisabled = false }: RecordingHeaderActionsProps) {
  const { t } = useTranslation();
  const label = t('recordings.label', { id: analysis.id });
  const mapButtonClassName = 'h-9 shrink-0 border-success/50 bg-success/10 px-3 text-success';

  return (
    <div className="flex shrink-0 items-center gap-1.5">
      {analysis.lat !== null &&
        analysis.lon !== null &&
        (mapLinkDisabled ? (
          <Button variant="outline" size="sm" disabled className={mapButtonClassName}>
            <MapIcon />
            {t('recordings.actions.mapLabel')}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className={cn(mapButtonClassName, 'hover:bg-success/20 hover:text-success')} asChild>
            <Link to={`/map?focus=${analysis.id}`}>
              <MapIcon />
              {t('recordings.actions.mapLabel')}
            </Link>
          </Button>
        ))}
      <DeleteRecordingDialog
        analysis={analysis}
        onDeleted={onDeleted}
        trigger={
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={t('recordings.actions.deleteAria', { label })}
          >
            <Trash2 className="size-5" />
          </Button>
        }
      />
    </div>
  );
}
