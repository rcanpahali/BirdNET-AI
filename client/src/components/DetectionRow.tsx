import { useTranslation } from 'react-i18next';
import type { Detection } from '@birdnet/types';
import { Badge } from './ui/badge';

interface DetectionRowProps {
  detection: Detection;
  variant?: 'card' | 'compact';
  /** When set, the card becomes clickable (e.g. to seek an audio player to this detection's start time). */
  onSelect?: (detection: Detection) => void;
}

export function DetectionRow({ detection, variant = 'card', onSelect }: DetectionRowProps) {
  const { t } = useTranslation();
  const {
    common_name: commonName,
    scientific_name: scientificName,
    confidence,
    start_time: startTime,
    end_time: endTime,
  } = detection;

  if (variant === 'compact') {
    return (
      <li className="border-b border-border px-3 py-2.5 last:border-b-0">
        <div className="mb-0.5 font-medium text-foreground">{commonName}</div>
        <div className="mb-1 text-[13px] italic text-muted-foreground">{scientificName}</div>
        <div className="text-xs text-muted-foreground/80">
          {t('results.confidencePrefix')} {(confidence * 100).toFixed(1)}% | {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
        </div>
      </li>
    );
  }

  const content = (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">{commonName}</h3>
        <Badge variant="success">{(confidence * 100).toFixed(1)}%</Badge>
      </div>
      <p className="mb-2 text-sm italic text-muted-foreground">{scientificName}</p>
      <div className="text-xs text-muted-foreground/80">
        {t('results.timePrefix')} {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
      </div>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(detection)}
        className="w-full rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {content}
      </button>
    );
  }

  return <div className="rounded-lg border border-border bg-card p-4 transition hover:border-primary/30 hover:shadow-sm">{content}</div>;
}
