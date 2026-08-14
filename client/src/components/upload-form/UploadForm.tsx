import { useState } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Mic, MapPin, Upload } from 'lucide-react';
import { requestCurrentPosition } from '../../lib/geolocation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
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

function validate(values: UploadFormValues, t: TFunction): FormErrors {
  const errors: FormErrors = {};

  if (!values.file) {
    errors.file = t('upload.errors.selectFile');
  }
  if (values.lat !== '' && Number.isNaN(Number(values.lat))) {
    errors.lat = t('upload.errors.latMustBeNumber');
  }
  if (values.lon !== '' && Number.isNaN(Number(values.lon))) {
    errors.lon = t('upload.errors.lonMustBeNumber');
  }

  return errors;
}

export function UploadForm({ loading, onSubmit, onFileSelected }: UploadFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<UploadFormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<'file' | 'lat' | 'lon', boolean>>>({});
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [showLocationFields, setShowLocationFields] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const errors = validate(values, t);
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
      ? t('upload.detectingLocation')
      : hasLocation
        ? `${Number(values.lat).toFixed(4)}, ${Number(values.lon).toFixed(4)}`
        : t('common.noLocationSet');

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">{t('upload.audioSourceLabel')}</span>
        <ToggleGroup
          type="single"
          value={inputMode}
          onValueChange={(value) => value && setInputMode(value as 'record' | 'upload')}
          disabled={loading}
          className="w-full"
        >
          <ToggleGroupItem value="record" className="flex-1">
            <Mic /> {t('upload.record')}
          </ToggleGroupItem>
          <ToggleGroupItem value="upload" className="flex-1">
            <Upload /> {t('upload.upload')}
          </ToggleGroupItem>
        </ToggleGroup>
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
            <span className="mb-2 block text-sm font-medium text-foreground">{t('upload.audioFileLabel')}</span>
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
                aria-label={t('upload.audioFileLabel')}
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
                  <span>{t('upload.dragDropHint')}</span>
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
          <div className="flex shrink-0 gap-3">
            <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => setShowLocationFields((prev) => !prev)}>
              {showLocationFields ? t('upload.hideLocation') : hasLocation ? t('upload.editLocation') : t('upload.setLocationManually')}
            </Button>
            {hasLocation && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                onClick={clearLocation}
              >
                {t('upload.clearLocation')}
              </Button>
            )}
          </div>
        </div>

        {showLocationFields && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="lat" className="sr-only">
                {t('upload.latitude')}
              </label>
              <Input
                type="number"
                id="lat"
                step="any"
                value={values.lat}
                onChange={handleLatChange}
                onBlur={() => markTouched('lat')}
                placeholder={t('upload.latitude')}
                disabled={loading}
              />
              {touched.lat && errors.lat && <p className="mt-1 text-xs text-destructive">{errors.lat}</p>}
            </div>
            <div>
              <label htmlFor="lon" className="sr-only">
                {t('upload.longitude')}
              </label>
              <Input
                type="number"
                id="lon"
                step="any"
                value={values.lon}
                onChange={handleLonChange}
                onBlur={() => markTouched('lon')}
                placeholder={t('upload.longitude')}
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
            {t('upload.minimumConfidence')}
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
        {loading ? t('upload.analyzing') : t('upload.analyzeAudio')}
      </Button>
    </form>
  );
}

export default UploadForm;
