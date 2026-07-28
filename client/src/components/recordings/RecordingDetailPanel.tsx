import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Analysis } from '@birdnet/types';
import { Bird, CheckCircle2, MapPin, Sparkles, Tag as TagIcon, X, XCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { AudioPlayer } from '../audio/AudioPlayer';
import type { AudioSource } from '../audio/AudioPlayer';
import { averageConfidence, formatConfidence, formatDateTime, formatDuration, formatLocation } from '../../lib/format';
import { speciesDistribution } from '../../lib/analytics';
import { useUpdateAnalysis } from '../../hooks/useUpdateAnalysis';

interface RecordingDetailPanelProps {
  analysis: Analysis;
  /** Only present when this analysis is the one just analyzed in this browser session. */
  audioSource?: AudioSource | null;
}

/**
 * Keyed by `analysis.id` from the parent so switching to a different
 * recording remounts this with fresh local state, instead of an effect
 * resyncing stale edit state from the previous analysis.
 */
function RecordingMetadataFields({ analysis }: { analysis: Analysis }) {
  const { t } = useTranslation();
  const updateAnalysis = useUpdateAnalysis();
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState(analysis.tags);
  const [notes, setNotes] = useState(analysis.notes ?? '');

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value || tags.includes(value)) {
      setTagDraft('');
      return;
    }
    const next = [...tags, value];
    setTags(next);
    setTagDraft('');
    updateAnalysis.mutate({ id: analysis.id, input: { tags: next } });
  };

  const removeTag = (value: string) => {
    const next = tags.filter((t) => t !== value);
    setTags(next);
    updateAnalysis.mutate({ id: analysis.id, input: { tags: next } });
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const notesDirty = notes !== (analysis.notes ?? '');
  const saveNotes = () => {
    updateAnalysis.mutate({ id: analysis.id, input: { notes } });
  };

  return (
    <>
      <div className="space-y-1.5">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <TagIcon className="size-3.5" /> {t('recordings.detail.tagsLabel')}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.length === 0 && <span className="text-xs text-muted-foreground">{t('recordings.detail.noTagsYet')}</span>}
          {tags.map((tag) => (
            <Badge key={tag} variant="muted" className="gap-1 pr-1">
              {tag}
              <button
                type="button"
                aria-label={t('recordings.detail.removeTagAria', { tag })}
                onClick={() => removeTag(tag)}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={tagDraft}
          onChange={(e) => setTagDraft(e.target.value)}
          onKeyDown={handleTagKeyDown}
          onBlur={addTag}
          placeholder={t('recordings.detail.addTagPlaceholder')}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.notesLabel')}</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('recordings.detail.addNotePlaceholder')}
          className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
          rows={2}
        />
        <Button size="sm" onClick={saveNotes} disabled={!notesDirty || updateAnalysis.isPending}>
          {updateAnalysis.isPending ? t('common.saving') : t('recordings.detail.saveNote')}
        </Button>
      </div>
    </>
  );
}

export function RecordingDetailPanel({ analysis, audioSource = null }: RecordingDetailPanelProps) {
  const { t } = useTranslation();
  const location = formatLocation(analysis, 5);
  const speciesCounts = speciesDistribution([analysis]);
  const avgConfidence = averageConfidence(analysis.detections);

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.recordedLabel')}</p>
        <p className="text-foreground">{formatDateTime(analysis.createdAt)}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.statusLabel')}</p>
        {analysis.status === 'completed' ? (
          <Badge variant="success">
            <CheckCircle2 /> {t('badges.analyzed')}
          </Badge>
        ) : (
          <div className="space-y-1">
            <Badge variant="destructive">
              <XCircle /> {t('badges.analysisFailed')}
            </Badge>
            {analysis.errorMessage && <p className="text-xs text-destructive">{analysis.errorMessage}</p>}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <MapPin className="size-3.5" /> {t('recordings.detail.locationLabel')}
        </p>
        <p className="text-foreground">{location ?? t('recordings.detail.notRecordedForFile')}</p>
      </div>

      <Separator />

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
        {speciesCounts.length === 0 ? (
          <p className="text-muted-foreground">{t('recordings.detail.noSpeciesAtThreshold')}</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {speciesCounts.map((species) => (
              <Badge key={species.commonName} variant="success">
                <span>{species.commonName}</span>
                <span className="opacity-70">· {t('recordings.detail.speciesBadgeCount', { count: species.count })}</span>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.recordingAudioLabel')}</p>
        <AudioPlayer
          key={audioSource?.url ?? `no-audio-${analysis.id}`}
          source={audioSource}
          detections={analysis.detections.map((d) => ({ label: d.common_name, startTime: d.start_time, endTime: d.end_time }))}
        />
      </div>

      <Separator />

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('recordings.detail.recordingQualityLabel')}</p>
        <div className="flex items-center gap-1.5">
          <Badge variant="muted">{t('common.notAssessed')}</Badge>
          <PlaceholderBadge note={t('common.noAudioQualityScoring')} />
        </div>
      </div>

      <RecordingMetadataFields key={analysis.id} analysis={analysis} />
    </div>
  );
}
