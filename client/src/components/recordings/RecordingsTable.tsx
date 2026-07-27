import type { Analysis } from '@birdnet/types';
import { CheckCircle2, MapPin } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { PLACEHOLDER_RECORDING_QUALITY } from '../../lib/mockData';

interface RecordingsTableProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
}

export function RecordingsTable({ analyses, onSelect }: RecordingsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Upload status</TableHead>
          <TableHead>AI status</TableHead>
          <TableHead>Species</TableHead>
          <TableHead>Quality</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {analyses.map((analysis) => {
          const uniqueSpecies = new Set(analysis.detections.map((d) => d.common_name)).size;
          const hasLocation = analysis.lat !== null && analysis.lon !== null;

          return (
            <TableRow key={analysis.id} onClick={() => onSelect(analysis)} className="cursor-pointer">
              <TableCell className="max-w-[220px] truncate font-medium text-foreground">{analysis.filename}</TableCell>
              <TableCell className="text-muted-foreground">{new Date(analysis.createdAt).toLocaleString()}</TableCell>
              <TableCell className="text-muted-foreground">
                {hasLocation ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-sky" />
                    {analysis.lat!.toFixed(3)}, {analysis.lon!.toFixed(3)}
                  </span>
                ) : (
                  '—'
                )}
              </TableCell>
              <TableCell>
                <Badge variant="success">
                  <CheckCircle2 /> Uploaded
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="success">
                  <CheckCircle2 /> Analyzed
                </Badge>
              </TableCell>
              <TableCell className={uniqueSpecies === 0 ? 'text-muted-foreground' : 'font-medium text-foreground'}>
                {uniqueSpecies}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <Badge variant="muted">{PLACEHOLDER_RECORDING_QUALITY}</Badge>
                  <PlaceholderBadge label="" note="No audio quality scoring is computed yet." />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
