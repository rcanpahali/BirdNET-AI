import { useEffect, useRef, useState } from 'react';
import { MediaRecorder as WavMediaRecorder, register } from 'extendable-media-recorder';
import type { IMediaRecorder } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

interface RecorderProps {
  onRecordingComplete: (file: File) => void;
  disabled?: boolean;
}

let wavEncoderRegistration: Promise<void> | null = null;

function ensureWavEncoderRegistered(): Promise<void> {
  wavEncoderRegistration ??= connect().then((port) => register(port));
  return wavEncoderRegistration;
}

export function Recorder({ onRecordingComplete, disabled = false }: RecorderProps) {
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
      setError('Unable to access microphone. Please grant permission.');
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
    <div className="w-full">
      <div className="mb-3 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
          className={`flex h-40 w-40 items-center justify-center rounded-full text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60 ${
            isRecording
              ? 'animate-pulse bg-gradient-to-br from-red-600 to-red-700'
              : 'bg-gradient-to-br from-[#667eea] to-[#764ba2] hover:scale-105'
          }`}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>
        {isRecording && (
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold text-red-600">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {audioBlob && !isRecording && (
        <div className="mt-3">
          <div className="mb-3 flex items-center justify-center gap-3">
            <p className="text-sm font-medium text-green-600">Recording ready ({formatTime(recordingTime)})</p>
            <button
              type="button"
              onClick={clearRecording}
              title="Delete recording and start over"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:scale-110"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
              </svg>
            </button>
          </div>
          <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
        </div>
      )}
    </div>
  );
}

export default Recorder;
