import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { requestCurrentPosition } from '../../lib/geolocation';
import { MicIcon, PinIcon, UploadIcon } from '../icons';
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
  `flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`;

const fieldClasses =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

export function UploadForm({ loading, onSubmit, onFileSelected }: UploadFormProps) {
  const [values, setValues] = useState<UploadFormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<'file' | 'lat' | 'lon', boolean>>>({});
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [showLocationFields, setShowLocationFields] = useState(false);

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

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    setField('file', selectedFile);
    markTouched('file');
    if (selectedFile) {
      onFileSelected?.();
      void detectLocation();
    }
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
        <span className="mb-2 block text-sm font-medium text-slate-700">Audio source</span>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setInputMode('record')}
            disabled={loading}
            className={segmentButtonClasses(inputMode === 'record')}
          >
            <MicIcon /> Record
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            disabled={loading}
            className={segmentButtonClasses(inputMode === 'upload')}
          >
            <UploadIcon /> Upload
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
            <span className="mb-2 block text-sm font-medium text-slate-700">Audio file</span>
            <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 transition has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:not(:disabled)]:hover:border-emerald-400 has-[:not(:disabled)]:hover:bg-emerald-50/50">
              <input
                type="file"
                aria-label="Audio file"
                accept="audio/*"
                onChange={handleFileChange}
                disabled={loading}
                className="sr-only"
              />
              {values.file ? (
                <span className="font-medium text-emerald-700">{values.file.name}</span>
              ) : (
                <span>Click to choose an audio file</span>
              )}
            </label>
          </>
        )}
        {touched.file && errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2 text-sm text-slate-600">
            <PinIcon className="h-4 w-4 shrink-0 text-slate-400" />
            <span className="truncate">{locationSummary}</span>
          </span>
          <div className="flex shrink-0 gap-3 text-xs font-medium">
            <button
              type="button"
              onClick={() => setShowLocationFields((prev) => !prev)}
              className="text-emerald-700 hover:text-emerald-800"
            >
              {showLocationFields ? 'Hide' : hasLocation ? 'Edit' : 'Set manually'}
            </button>
            {hasLocation && (
              <button type="button" onClick={clearLocation} className="text-slate-400 hover:text-red-600">
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
              <input
                type="number"
                id="lat"
                step="any"
                value={values.lat}
                onChange={handleLatChange}
                onBlur={() => markTouched('lat')}
                placeholder="Latitude"
                disabled={loading}
                className={fieldClasses}
              />
              {touched.lat && errors.lat && <p className="mt-1 text-xs text-red-600">{errors.lat}</p>}
            </div>
            <div>
              <label htmlFor="lon" className="sr-only">
                Longitude
              </label>
              <input
                type="number"
                id="lon"
                step="any"
                value={values.lon}
                onChange={handleLonChange}
                onBlur={() => markTouched('lon')}
                placeholder="Longitude"
                disabled={loading}
                className={fieldClasses}
              />
              {touched.lon && errors.lon && <p className="mt-1 text-xs text-red-600">{errors.lon}</p>}
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label htmlFor="minConf" className="text-sm font-medium text-slate-700">
            Minimum confidence
          </label>
          <span className="text-sm font-medium text-slate-500">{confidencePercent}%</span>
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
          className="w-full accent-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={loading || hasErrors}
        className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:enabled:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Analyzing…' : 'Analyze audio'}
      </button>
    </form>
  );
}

export default UploadForm;
