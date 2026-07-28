import { useTranslation } from 'react-i18next';
import type { AnalyzerResponse } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';

interface ResultsPanelProps {
  results: AnalyzerResponse;
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  const { t } = useTranslation();
  const { detection_count: detectionCount, filename, detections } = results;

  return (
    <div className="mt-8 border-t border-border pt-6">
      <h2 className="mb-1 text-lg font-semibold text-foreground">{t('results.title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {t('results.foundPrefix')} <strong className="font-semibold text-foreground">{detectionCount}</strong>{' '}
        {t('results.detectionSuffix', { count: detectionCount })}{' '}
        <strong className="font-semibold text-foreground">{filename}</strong>
      </p>

      {detections.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          {t('results.noDetections')}
        </p>
      ) : (
        <div className="grid gap-3">
          {detections.map((detection, index) => (
            <DetectionRow key={`${detection.common_name}-${detection.start_time}-${index}`} detection={detection} />
          ))}
        </div>
      )}
    </div>
  );
}
