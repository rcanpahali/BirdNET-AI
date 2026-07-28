import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { AnalyzerResponse } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';
import { AudioPlayer } from '../audio/AudioPlayer';
import type { AudioPlayerHandle, AudioSource } from '../audio/AudioPlayer';

interface ResultsPanelProps {
  results: AnalyzerResponse;
  /** Object URL of the file just analyzed, held in memory for this session only. */
  audioSource?: AudioSource | null;
}

export function ResultsPanel({ results, audioSource = null }: ResultsPanelProps) {
  const { t } = useTranslation();
  const { detections } = results;
  const playerRef = useRef<AudioPlayerHandle>(null);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.recordingAudioLabel')}</p>
        <AudioPlayer
          ref={playerRef}
          source={audioSource}
          detections={detections.map((d) => ({ label: d.common_name, startTime: d.start_time, endTime: d.end_time }))}
        />
      </div>

      {detections.length === 0 ? (
        <p className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          {t('results.noDetections')}
        </p>
      ) : (
        <div className="grid gap-3">
          {detections.map((detection, index) => (
            <DetectionRow
              key={`${detection.common_name}-${detection.start_time}-${index}`}
              detection={detection}
              onSelect={(d) => playerRef.current?.seekTo(d.start_time)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
