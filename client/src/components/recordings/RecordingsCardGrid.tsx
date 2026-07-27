import type { Analysis } from '@birdnet/types';
import { CheckCircle2, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { PLACEHOLDER_RECORDING_QUALITY } from '../../lib/mockData';

interface RecordingsCardGridProps {
  analyses: Analysis[];
  onSelect: (analysis: Analysis) => void;
}

export function RecordingsCardGrid({ analyses, onSelect }: RecordingsCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {analyses.map((analysis) => {
        const uniqueSpecies = new Set(analysis.detections.map((d) => d.common_name)).size;
        const hasLocation = analysis.lat !== null && analysis.lon !== null;

        return (
          <Card
            key={analysis.id}
            onClick={() => onSelect(analysis)}
            className="cursor-pointer transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-2">
              <CardTitle className="truncate">{analysis.filename}</CardTitle>
              <p className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleString()}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="success">
                  <CheckCircle2 /> Analyzed
                </Badge>
                <Badge variant={uniqueSpecies > 0 ? 'default' : 'muted'}>
                  {uniqueSpecies} species
                </Badge>
                <Badge variant="muted">{PLACEHOLDER_RECORDING_QUALITY}</Badge>
                <PlaceholderBadge label="" note="No audio quality scoring is computed yet." />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" />
                {hasLocation ? `${analysis.lat!.toFixed(3)}, ${analysis.lon!.toFixed(3)}` : 'No location recorded'}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
