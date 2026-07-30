import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Analysis } from '@birdnet/types';
import { CheckCircle2, Map as MapIcon, MapPin, Trash2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { DeleteRecordingDialog } from './DeleteRecordingDialog';
import { formatDateTime, formatDuration, formatLocation } from '../../lib/format';
import { cn } from '../../lib/utils';

interface RecordingsCardGridProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
  /** Highlights the card for this analysis id (e.g. the one open in the detail panel). */
  selectedId?: number | null;
  /** Omitting this hides the delete action -- used for compact previews. */
  onDeleted?: (id: number) => void;
}

export function RecordingsCardGrid({ analyses, onSelect, selectedId = null, onDeleted }: RecordingsCardGridProps) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {analyses.map((analysis) => {
        const uniqueSpecies = new Set(analysis.detections.map((d) => d.common_name)).size;
        const location = formatLocation(analysis);

        return (
          <Card
            key={analysis.id}
            onClick={() => onSelect(analysis)}
            className={cn(
              'cursor-pointer transition-shadow hover:shadow-md',
              analysis.id === selectedId && 'ring-2 ring-primary'
            )}
          >
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-2">
              <div className="min-w-0">
                <CardTitle className="truncate">{t('recordings.label', { id: analysis.id })}</CardTitle>
                <p className="text-xs text-muted-foreground">{formatDateTime(analysis.createdAt)}</p>
              </div>
              {/* `onClick` stops propagation here, not just on each trigger -- Radix's Dialog
                  portals its content to `document.body`, but React bubbles portal events through
                  the *React* tree, not the DOM tree, so a click on the confirm button inside the
                  delete dialog would otherwise still reach this card's `onSelect`. */}
              <div className="flex shrink-0 items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {analysis.lat !== null && analysis.lon !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 px-2 border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success"
                    asChild
                  >
                    <Link to={`/map?focus=${analysis.id}`}>
                      <MapIcon />
                      {t('recordings.actions.mapLabel')}
                    </Link>
                  </Button>
                )}
                {onDeleted && (
                  <DeleteRecordingDialog
                    analysis={analysis}
                    onDeleted={() => onDeleted(analysis.id)}
                    trigger={
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label={t('recordings.actions.deleteAria', { label: t('recordings.label', { id: analysis.id }) })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    }
                  />
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {analysis.status === 'completed' ? (
                  <Badge variant="success">
                    <CheckCircle2 /> {t('badges.analyzed')}
                  </Badge>
                ) : (
                  <Badge variant="destructive" title={analysis.errorMessage ?? undefined}>
                    <XCircle /> {t('badges.failed')}
                  </Badge>
                )}
                <Badge variant={uniqueSpecies > 0 ? 'default' : 'muted'}>
                  {t('recordings.cardGrid.speciesCount', { count: uniqueSpecies })}
                </Badge>
                <Badge variant="muted">{t('common.notAssessed')}</Badge>
                <PlaceholderBadge label="" note={t('common.noAudioQualityScoring')} />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {location ?? t('recordings.cardGrid.noLocationRecorded')}
                </p>
                <p>{formatDuration(analysis.duration)}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
