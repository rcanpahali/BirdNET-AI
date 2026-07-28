import { useTranslation } from 'react-i18next';
import type { Analysis } from '@birdnet/types';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { averageConfidence, formatConfidence, formatDateShort, formatDuration, formatLocation } from '../../lib/format';
import { cn } from '../../lib/utils';

interface RecordingsTableProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
  /** Hides the Location column -- used for compact previews (e.g. the dashboard). */
  showLocation?: boolean;
  /** Highlights the row for this analysis id (e.g. the one open in the detail panel). */
  selectedId?: number | null;
}

export function RecordingsTable({ analyses, onSelect, showLocation = true, selectedId = null }: RecordingsTableProps) {
  const { t } = useTranslation();
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('recordings.table.colName')}</TableHead>
          <TableHead>{t('recordings.table.colDate')}</TableHead>
          {showLocation && <TableHead>{t('recordings.table.colLocation')}</TableHead>}
          <TableHead>{t('common.duration')}</TableHead>
          <TableHead>{t('recordings.table.colStatus')}</TableHead>
          <TableHead>{t('recordings.detail.speciesDetectedLabel')}</TableHead>
          <TableHead>{t('recordings.detail.avgConfidence')}</TableHead>
          <TableHead>{t('recordings.table.colQuality')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {analyses.map((analysis) => {
          const speciesNames = [...new Set(analysis.detections.map((d) => d.common_name))];
          const location = formatLocation(analysis);
          const avgConfidence = averageConfidence(analysis.detections);

          return (
            <TableRow
              key={analysis.id}
              onClick={() => onSelect(analysis)}
              data-state={analysis.id === selectedId ? 'selected' : undefined}
              className="cursor-pointer"
            >
              <TableCell className="font-medium text-foreground">{t('recordings.label', { id: analysis.id })}</TableCell>
              <TableCell className="text-muted-foreground">{formatDateShort(analysis.createdAt)}</TableCell>
              {showLocation && (
                <TableCell className="text-muted-foreground">
                  {location ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5 text-sky" />
                      {location}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
              )}
              <TableCell className="text-muted-foreground">{formatDuration(analysis.duration)}</TableCell>
              <TableCell>
                {analysis.status === 'completed' ? (
                  <Badge variant="success">
                    <CheckCircle2 /> {t('badges.analyzed')}
                  </Badge>
                ) : (
                  <Badge variant="destructive" title={analysis.errorMessage ?? undefined}>
                    <XCircle /> {t('badges.failed')}
                  </Badge>
                )}
              </TableCell>
              <TableCell
                className={cn('max-w-[220px] truncate', speciesNames.length === 0 ? 'text-muted-foreground' : 'text-foreground')}
                title={speciesNames.join(', ') || undefined}
              >
                {speciesNames.length > 0 ? speciesNames.join(', ') : '—'}
              </TableCell>
              <TableCell className={avgConfidence === null ? 'text-muted-foreground' : 'font-medium text-foreground'}>
                {formatConfidence(avgConfidence)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="muted">{t('common.notAssessed')}</Badge>
                  <PlaceholderBadge label="" note={t('common.noAudioQualityScoring')} />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
