import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { Analysis } from '@birdnet/types';
import { ArrowDown, ArrowUp, ArrowUpDown, CheckCircle2, Map as MapIcon, MapPin, Trash2, XCircle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { DeleteRecordingDialog } from './DeleteRecordingDialog';
import { averageConfidence, formatConfidence, formatDateShort, formatDuration, formatLocation } from '../../lib/format';
import type { RecordingSort, RecordingSortKey } from '../../lib/sortRecordings';
import { cn } from '../../lib/utils';

interface RecordingsTableProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
  /** Hides the Location column -- used for compact previews (e.g. the dashboard). */
  showLocation?: boolean;
  /** Highlights the row for this analysis id (e.g. the one open in the detail panel). */
  selectedId?: number | null;
  /** Omitting these renders plain, non-interactive headers (e.g. the dashboard's compact preview). */
  sort?: RecordingSort;
  onSortChange?: (next: RecordingSort) => void;
  /** Omitting this hides the delete action -- used for compact previews (e.g. the dashboard). */
  onDeleted?: (id: number) => void;
}

interface SortableHeaderProps {
  label: string;
  sortKey: RecordingSortKey;
  sort?: RecordingSort;
  onSortChange?: (next: RecordingSort) => void;
}

function SortableHeader({ label, sortKey, sort, onSortChange }: SortableHeaderProps) {
  if (!onSortChange) return <TableHead>{label}</TableHead>;

  const active = sort?.key === sortKey;
  const direction = active ? sort.direction : null;

  return (
    <TableHead aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'}>
      <button
        type="button"
        onClick={() => onSortChange({ key: sortKey, direction: active && direction === 'asc' ? 'desc' : 'asc' })}
        className="flex items-center gap-1 hover:text-foreground"
      >
        {label}
        {direction === 'asc' ? (
          <ArrowUp className="size-3.5" />
        ) : direction === 'desc' ? (
          <ArrowDown className="size-3.5" />
        ) : (
          <ArrowUpDown className="size-3.5 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

export function RecordingsTable({
  analyses,
  onSelect,
  showLocation = true,
  selectedId = null,
  sort,
  onSortChange,
  onDeleted,
}: RecordingsTableProps) {
  const { t } = useTranslation();
  const stopRowSelect = (event: MouseEvent) => event.stopPropagation();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('recordings.table.colName')}</TableHead>
          <SortableHeader label={t('recordings.table.colDate')} sortKey="date" sort={sort} onSortChange={onSortChange} />
          <SortableHeader label={t('common.detections')} sortKey="detections" sort={sort} onSortChange={onSortChange} />
          <SortableHeader
            label={t('recordings.detail.speciesDetectedLabel')}
            sortKey="speciesCount"
            sort={sort}
            onSortChange={onSortChange}
          />
          <SortableHeader label={t('common.duration')} sortKey="duration" sort={sort} onSortChange={onSortChange} />
          <SortableHeader label={t('recordings.detail.avgConfidence')} sortKey="confidence" sort={sort} onSortChange={onSortChange} />
          <SortableHeader label={t('recordings.table.colStatus')} sortKey="status" sort={sort} onSortChange={onSortChange} />
          <TableHead>{t('recordings.table.colQuality')}</TableHead>
          {showLocation && <TableHead>{t('recordings.table.colLocation')}</TableHead>}
          <TableHead>{t('recordings.table.colActions')}</TableHead>
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
              <TableCell className="text-foreground">{analysis.detectionCount}</TableCell>
              <TableCell
                className={cn(
                  'max-w-[220px] truncate text-xs',
                  speciesNames.length === 0 ? 'text-muted-foreground' : 'text-foreground'
                )}
                title={speciesNames.join(', ') || undefined}
              >
                {speciesNames.length > 0 ? speciesNames.join(', ') : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDuration(analysis.duration)}</TableCell>
              <TableCell className={avgConfidence === null ? 'text-muted-foreground' : 'font-medium text-foreground'}>
                {formatConfidence(avgConfidence)}
              </TableCell>
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
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="muted">{t('common.notAssessed')}</Badge>
                  <PlaceholderBadge label="" note={t('common.noAudioQualityScoring')} />
                </div>
              </TableCell>
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
              <TableCell onClick={stopRowSelect}>
                <div className="flex items-center gap-1.5">
                  {analysis.lat !== null && analysis.lon !== null ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-success/50 bg-success/10 text-success hover:bg-success/20 hover:text-success"
                      asChild
                    >
                      <Link to={`/map?focus=${analysis.id}`}>
                        <MapIcon />
                        {t('recordings.actions.mapLabel')}
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
