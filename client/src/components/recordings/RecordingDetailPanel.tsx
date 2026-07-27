import type { Analysis } from '@birdnet/types';
import { MapPin, Tag as TagIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { AudioPlayer } from '../audio/AudioPlayer';
import type { AudioSource } from '../audio/AudioPlayer';
import { PLACEHOLDER_RECORDING_QUALITY } from '../../lib/mockData';

interface RecordingDetailPanelProps {
  analysis: Analysis;
  /** Only present when this analysis is the one just analyzed in this browser session. */
  audioSource?: AudioSource | null;
}

function averageConfidence(analysis: Analysis): number | null {
  if (analysis.detections.length === 0) return null;
  const sum = analysis.detections.reduce((acc, d) => acc + d.confidence, 0);
  return sum / analysis.detections.length;
}

export function RecordingDetailPanel({ analysis, audioSource = null }: RecordingDetailPanelProps) {
  const hasLocation = analysis.lat !== null && analysis.lon !== null;
  const uniqueSpecies = [...new Map(analysis.detections.map((d) => [d.common_name, d])).values()];
  const avgConfidence = averageConfidence(analysis);

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorded</p>
        <p className="text-foreground">{new Date(analysis.createdAt).toLocaleString()}</p>
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5" /> GPS coordinates
        </p>
        <p className="text-foreground">
          {hasLocation ? `${analysis.lat!.toFixed(5)}, ${analysis.lon!.toFixed(5)}` : 'Not recorded for this file'}
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">AI detection summary</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-lg font-semibold text-foreground">{analysis.detectionCount}</p>
            <p className="text-xs text-muted-foreground">Detections</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-lg font-semibold text-foreground">{avgConfidence !== null ? `${(avgConfidence * 100).toFixed(0)}%` : '—'}</p>
            <p className="text-xs text-muted-foreground">Avg. confidence</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Species detected</p>
        {uniqueSpecies.length === 0 ? (
          <p className="text-muted-foreground">No species detected at the current confidence threshold.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {uniqueSpecies.map((detection) => (
              <Badge key={detection.common_name} variant="success">
                {detection.common_name}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recording audio</p>
        <AudioPlayer
          key={audioSource?.url ?? `no-audio-${analysis.id}`}
          source={audioSource}
          detections={analysis.detections.map((d) => ({ label: d.common_name, startTime: d.start_time, endTime: d.end_time }))}
        />
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recording quality</p>
          <div className="flex items-center gap-1.5">
            <Badge variant="muted">{PLACEHOLDER_RECORDING_QUALITY}</Badge>
            <PlaceholderBadge note="No audio quality scoring is computed yet." />
          </div>
        </div>
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <TagIcon className="size-3.5" /> Tags
          </p>
          <div className="flex items-center gap-1.5">
            <Badge variant="muted">None</Badge>
            <PlaceholderBadge note="Tagging isn't implemented -- there's no tags column yet." />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</Label>
          <PlaceholderBadge note="Notes aren't persisted -- there's no field for them yet." />
        </div>
        <textarea
          disabled
          placeholder="Add a note about this recording…"
          className="w-full resize-none rounded-md border border-dashed border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground placeholder:text-muted-foreground/70"
          rows={2}
        />
      </div>
    </div>
  );
}
