import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MediaRecorder as WavMediaRecorder, register } from 'extendable-media-recorder';
import type { IMediaRecorder } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';
import { Mic, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface RecorderProps {
  onRecordingComplete: (file: File) => void;
  onRecordingStart?: () => void;
  disabled?: boolean;
}

let wavEncoderRegistration: Promise<void> | null = null;

function ensureWavEncoderRegistered(): Promise<void> {
  wavEncoderRegistration ??= connect().then((port) => register(port));
  return wavEncoderRegistration;
}

export function Recorder({ onRecordingComplete, onRecordingStart, disabled = false }: RecorderProps) {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<IMediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      onRecordingStart?.();
      await ensureWavEncoderRegistered();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new WavMediaRecorder(stream, { mimeType: 'audio/wav' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        onRecordingComplete(new File([blob], `recording-${Date.now()}.wav`, { type: 'audio/wav' }));
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError(t('recorder.micPermissionError'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    setError('');
  };

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-6">
      <div className="flex flex-col items-center gap-2">
        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'default'}
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          title={isRecording ? t('recorder.stopRecording') : t('recorder.startRecording')}
          className={cn('h-16 w-16 rounded-full [&_svg]:size-6', isRecording && 'animate-pulse')}
        >
          <Mic />
        </Button>
        <p className="text-xs text-muted-foreground">{isRecording ? t('recorder.recording') : t('recorder.tapToRecord')}</p>
        {isRecording && <span className="font-mono text-lg font-semibold text-destructive">{formatTime(recordingTime)}</span>}
      </div>

      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}

      {audioBlob && !isRecording && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-center gap-3">
            <p className="text-sm font-medium text-primary">{t('recorder.recordingReady', { time: formatTime(recordingTime) })}</p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearRecording}
              title={t('recorder.deleteRecordingTitle')}
              className="size-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
        </div>
      )}
    </div>
  );
}

export default Recorder;
