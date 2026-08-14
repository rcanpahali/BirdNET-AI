import { useTranslation } from 'react-i18next';
import type { Analysis } from '@birdnet/types';
import { Bird, Sparkles } from 'lucide-react';
import { SpeciesBadgeList } from '../shared/SpeciesBadgeList';
import { averageConfidence, formatConfidence, formatDuration } from '../../lib/format';
import { speciesDistribution } from '../../lib/analytics';

interface RecordingSummaryProps {
  analysis: Analysis;
}

/** The "AI detection summary" stat grid and species badge list -- shared between the detail panel and the delete confirmation dialog. */
export function RecordingSummary({ analysis }: RecordingSummaryProps) {
  const { t } = useTranslation();
  const speciesCounts = speciesDistribution([analysis]);
  const avgConfidence = averageConfidence(analysis.detections);

  return (
    <>
      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-3.5" /> {t('recordings.detail.aiDetectionSummary')}
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-lg font-semibold text-foreground">{analysis.detectionCount}</p>
            <p className="text-xs text-muted-foreground">{t('common.detections')}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-lg font-semibold text-foreground">{formatConfidence(avgConfidence)}</p>
            <p className="text-xs text-muted-foreground">{t('recordings.detail.avgConfidence')}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-lg font-semibold text-foreground">{formatDuration(analysis.duration)}</p>
            <p className="text-xs text-muted-foreground">{t('common.duration')}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Bird className="size-3.5" /> {t('recordings.detail.speciesDetectedLabel')}
        </p>
        <SpeciesBadgeList species={speciesCounts} emptyLabel={t('recordings.detail.noSpeciesDetected')} />
      </div>
    </>
  );
}
