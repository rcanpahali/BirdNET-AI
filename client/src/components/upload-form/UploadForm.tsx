import { useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { Mic, MapPin, Upload } from 'lucide-react';
import { requestCurrentPosition } from '../../lib/geolocation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import { Recorder } from './Recorder';

export interface UploadFormValues {
  file: File | null;
  lat: string;
  lon: string;
  minConf: string;
}

interface UploadFormProps {
  loading: boolean;
  onSubmit: (values: UploadFormValues) => void;
  onFileSelected?: () => void;
}

type FormErrors = Partial<Record<'file' | 'lat' | 'lon', string>>;
type LocationStatus = 'idle' | 'detecting' | 'detected' | 'unavailable';

const initialValues: UploadFormValues = { file: null, lat: '', lon: '', minConf: '0.25' };

function validate(values: UploadFormValues): FormErrors {
  const errors: FormErrors = {};

  if (!values.file) {
    errors.file = 'Please select an audio file';
  }
  if (values.lat !== '' && Number.isNaN(Number(values.lat))) {
    errors.lat = 'Latitude must be a number';
  }
  if (values.lon !== '' && Number.isNaN(Number(values.lon))) {
    errors.lon = 'Longitude must be a number';
  }

  return errors;
}

const segmentButtonClasses = (active: boolean) =>
  cn(
    'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
    active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
  );

export function UploadForm({ loading, onSubmit, onFileSelected }: UploadFormProps) {
  const [values, setValues] = useState<UploadFormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<'file' | 'lat' | 'lon', boolean>>>({});
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const errors = validate(values);
  const hasErrors = Boolean(errors.file || errors.lat || errors.lon);
  const hasLocation = values.lat !== '' && values.lon !== '';

  const setField = <K extends keyof UploadFormValues>(field: K, value: UploadFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: 'file' | 'lat' | 'lon') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Triggered when the user starts a recording or picks a file to upload.
  // Never blocks or errors -- if location isn't available/allowed, the
  // lat/lon fields are simply left for manual entry (or empty).
  const detectLocation = async () => {
    if (values.lat !== '' || values.lon !== '') return; // manual entry always wins

    setLocationStatus('detecting');
    const position = await requestCurrentPosition();
    if (position) {
      setField('lat', String(position.lat));
      setField('lon', String(position.lon));
      setLocationStatus('detected');
    } else {
      setLocationStatus('unavailable');
    }
  };

  const selectFile = (selectedFile: File | null) => {
    setField('file', selectedFile);
    markTouched('file');
    if (selectedFile) {
      onFileSelected?.();
      void detectLocation();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.currentTarget.files?.[0] ?? null);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    if (loading) return;
    const droppedFile = event.dataTransfer.files?.[0];
    if (droppedFile) selectFile(droppedFile);
  };

  const handleRecordingComplete = (file: File) => {
    setField('file', file);
    markTouched('file');
    onFileSelected?.();
  };

  const handleLatChange = (event: ChangeEvent<HTMLInputElement>) => {
    setField('lat', event.target.value);
    setLocationStatus('idle');
  };

  const handleLonChange = (event: ChangeEvent<HTMLInputElement>) => {
    setField('lon', event.target.value);
    setLocationStatus('idle');
  };

  const clearLocation = () => {
    setField('lat', '');
    setField('lon', '');
    setLocationStatus('idle');
    setShowLocationFields(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ file: true, lat: true, lon: true });
    if (hasErrors) return;
    onSubmit(values);
  };

  const confidencePercent = Math.round(Number(values.minConf) * 100);

  const locationSummary =
    locationStatus === 'detecting'
      ? 'Detecting your location…'
      : hasLocation
        ? `${Number(values.lat).toFixed(4)}, ${Number(values.lon).toFixed(4)}`
        : 'No location set';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">Audio source</span>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setInputMode('record')}
            disabled={loading}
            className={segmentButtonClasses(inputMode === 'record')}
          >
            <Mic className="size-4" /> Record
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            disabled={loading}
            className={segmentButtonClasses(inputMode === 'upload')}
          >
            <Upload className="size-4" /> Upload
          </button>
        </div>
      </div>

      <div>
        {inputMode === 'record' ? (
          <Recorder
            onRecordingComplete={handleRecordingComplete}
            onRecordingStart={detectLocation}
            disabled={loading}
          />
        ) : (
          <>
            <span className="mb-2 block text-sm font-medium text-foreground">Audio file</span>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                if (!loading) setIsDraggingOver(true);
              }}
              onDragLeave={() => setIsDraggingOver(false)}
              onDrop={handleDrop}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50',
                isDraggingOver ? 'border-primary bg-primary/5' : 'border-input bg-muted/40 text-muted-foreground has-[:not(:disabled)]:hover:border-primary/50 has-[:not(:disabled)]:hover:bg-primary/5'
              )}
            >
              <input
                type="file"
                aria-label="Audio file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
              />
              {values.file ? (
                <span className="font-medium text-primary">{values.file.name}</span>
              ) : (
                <>
                  <Upload className="size-5 text-muted-foreground/70" />
                  <span>Drag and drop an audio file, or click to browse</span>
                </>
              )}
            </label>
          </>
        )}
        {touched.file && errors.file && <p className="mt-2 text-sm text-destructive">{errors.file}</p>}
      </div>

      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="size-4 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{locationSummary}</span>
          </span>
          <div className="flex shrink-0 gap-3 text-xs font-medium">
            <button type="button" onClick={() => setShowLocationFields((prev) => !prev)} className="text-primary hover:text-primary/80">
              {showLocationFields ? 'Hide' : hasLocation ? 'Edit' : 'Set manually'}
            </button>
            {hasLocation && (
              <button type="button" onClick={clearLocation} className="text-muted-foreground hover:text-destructive">
                Clear
              </button>
            )}
          </div>
        </div>

        {showLocationFields && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="lat" className="sr-only">
                Latitude
              </label>
              <Input
                type="number"
                id="lat"
                step="any"
                value={values.lat}
                onChange={handleLatChange}
                onBlur={() => markTouched('lat')}
                placeholder="Latitude"
                disabled={loading}
              />
              {touched.lat && errors.lat && <p className="mt-1 text-xs text-destructive">{errors.lat}</p>}
            </div>
            <div>
              <label htmlFor="lon" className="sr-only">
                Longitude
              </label>
              <Input
                type="number"
                id="lon"
                step="any"
                value={values.lon}
                onChange={handleLonChange}
                onBlur={() => markTouched('lon')}
                placeholder="Longitude"
                disabled={loading}
              />
              {touched.lon && errors.lon && <p className="mt-1 text-xs text-destructive">{errors.lon}</p>}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="minConf" className="text-sm font-medium text-foreground">
            Minimum confidence
          </label>
          <span className="text-sm font-medium text-muted-foreground">{confidencePercent}%</span>
        </div>
        <input
          type="range"
          id="minConf"
          min="0"
          max="1"
          step="0.05"
          value={values.minConf}
          onChange={(event) => setField('minConf', event.target.value)}
          disabled={loading}
          className="w-full accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <Button type="submit" disabled={loading || hasErrors} className="w-full" size="lg">
        {loading ? 'Analyzing…' : 'Analyze audio'}
      </Button>
    </form>
  );
}

export default UploadForm;
