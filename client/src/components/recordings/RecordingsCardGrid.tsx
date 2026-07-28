import { useTranslation } from 'react-i18next';
import type { Analysis } from '@birdnet/types';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { formatDateTime, formatDuration, formatLocation } from '../../lib/format';
import { cn } from '../../lib/utils';

interface RecordingsCardGridProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
  /** Highlights the card for this analysis id (e.g. the one open in the detail panel). */
  selectedId?: number | null;
}

export function RecordingsCardGrid({ analyses, onSelect, selectedId = null }: RecordingsCardGridProps) {
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
            <CardHeader className="pb-2">
              <CardTitle className="truncate">{t('recordings.label', { id: analysis.id })}</CardTitle>
              <p className="text-xs text-muted-foreground">{formatDateTime(analysis.createdAt)}</p>
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
