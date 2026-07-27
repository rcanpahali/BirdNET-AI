import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pause, Play, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '../ui/button';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../../lib/utils';

export interface AudioDetectionMarker {
  label: string;
  startTime: number;
  endTime: number;
}

export interface AudioSource {
  url: string;
  filename: string;
}

interface AudioPlayerProps {
  /**
   * Only set for audio that's still in memory from *this* upload/record
   * session (the object URL of the file just analyzed) -- FastAPI/Express
   * don't persist the audio file, so historical recordings loaded from
   * `/analyses` have no source and fall back to a disabled placeholder.
   */
  source: AudioSource | null;
  detections?: AudioDetectionMarker[];
}

const SPEEDS = [0.5, 1, 1.5, 2];
const BAR_COUNT = 140;
const ZOOM_LEVELS = [1, 1.5, 2, 3];

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Deterministic filler pattern so the disabled placeholder waveform doesn't look randomly broken. */
function placeholderPeaks(count: number): number[] {
  return Array.from({ length: count }, (_, i) => 0.15 + 0.25 * Math.abs(Math.sin(i * 0.4)));
}

export function AudioPlayer({ source, detections = [] }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [peaks, setPeaks] = useState<number[] | null>(null);

  // Callers key this component on the source's identity (see
  // RecordingDetailPanel), so a `source` change always remounts it -- state
  // never needs to be reset from within the effect itself.
  useEffect(() => {
    if (!source) return;

    let cancelled = false;
    const AudioContextCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    (async () => {
      try {
        const ctx = new AudioContextCtor();
        const response = await fetch(source.url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        if (cancelled) return;

        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.max(1, Math.floor(channelData.length / BAR_COUNT));
        const computed: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          let max = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            const value = Math.abs(channelData[start + j] ?? 0);
            if (value > max) max = value;
          }
          computed.push(max);
        }
        setPeaks(computed);
        void ctx.close();
      } catch {
        if (!cancelled) setPeaks(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source]);

  const displayPeaks = useMemo(() => peaks ?? placeholderPeaks(BAR_COUNT), [peaks]);
  const disabled = !source;
  const zoom = ZOOM_LEVELS[zoomIndex];

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      void audioRef.current.play();
    }
  };

  const handleSeekFromRatio = (ratio: number) => {
    if (!audioRef.current || !duration) return;
    const next = Math.min(Math.max(ratio, 0), 1) * duration;
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const progressRatio = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
      {source && (
        <audio
          ref={audioRef}
          src={source.url}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          className="hidden"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="icon" variant={disabled ? 'outline' : 'default'} disabled={disabled} onClick={togglePlay}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>

        <span className="min-w-[5.5rem] font-mono text-xs text-muted-foreground">
          {formatTime(currentTime)} / {duration ? formatTime(duration) : '—:—'}
        </span>

        <ToggleGroup
          type="single"
          size="sm"
          value={String(playbackRate)}
          onValueChange={(value) => value && setPlaybackRate(Number(value))}
          className="ml-auto"
        >
          {SPEEDS.map((speed) => (
            <ToggleGroupItem
              key={speed}
              value={String(speed)}
              disabled={disabled}
              onClick={() => {
                if (audioRef.current) audioRef.current.playbackRate = speed;
              }}
              className="px-2 text-xs"
            >
              {speed}x
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled || zoomIndex === 0}
            onClick={() => setZoomIndex((z) => Math.max(0, z - 1))}
            aria-label="Zoom out waveform"
          >
            <ZoomOut className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            disabled={disabled || zoomIndex === ZOOM_LEVELS.length - 1}
            onClick={() => setZoomIndex((z) => Math.min(ZOOM_LEVELS.length - 1, z + 1))}
            aria-label="Zoom in waveform"
          >
            <ZoomIn className="size-4" />
          </Button>
        </div>

        <Button type="button" size="icon" variant="ghost" disabled={disabled} asChild={!disabled}>
          {disabled ? (
            <Download className="size-4" />
          ) : (
            <a href={source.url} download={source.filename} aria-label="Download recording">
              <Download className="size-4" />
            </a>
          )}
        </Button>
      </div>

      <div className="overflow-x-auto">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleSeekFromRatio((e.clientX - rect.left) / rect.width);
          }}
          className="relative flex h-16 items-end gap-px rounded-md bg-background px-1 py-1 disabled:cursor-not-allowed"
          style={{ width: `${100 * zoom}%`, minWidth: '100%' }}
          aria-label="Seek within recording"
        >
          {displayPeaks.map((peak, index) => {
            const played = !disabled && index / BAR_COUNT <= progressRatio;
            return (
              <span
                key={index}
                className={cn('flex-1 rounded-sm', disabled ? 'bg-border' : played ? 'bg-primary' : 'bg-primary/25')}
                style={{ height: `${Math.max(6, peak * 100)}%` }}
              />
            );
          })}

          {!disabled &&
            duration > 0 &&
            detections.map((marker, index) => (
              <Tooltip key={`${marker.label}-${index}`}>
                <TooltipTrigger asChild>
                  <span
                    className="absolute top-0 h-full w-0.5 bg-sky"
                    style={{ left: `${(marker.startTime / duration) * 100}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  {marker.label} · {formatTime(marker.startTime)}–{formatTime(marker.endTime)}
                </TooltipContent>
              </Tooltip>
            ))}
        </button>
      </div>

      {disabled && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">Audio isn&apos;t stored for past recordings yet -- playback is unavailable.</p>
          <PlaceholderBadge label="Waveform placeholder" note="Real waveform + playback only works for recordings analyzed in this session." />
        </div>
      )}
    </div>
  );
}
