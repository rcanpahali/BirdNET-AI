import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
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

type FormErrors = Partial<Record<keyof UploadFormValues, string>>;

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
  if (values.minConf !== '') {
    const parsed = Number.parseFloat(values.minConf);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      errors.minConf = 'Enter a value between 0 and 1';
    }
  }

  return errors;
}

const toggleButtonClasses = (active: boolean) =>
  `flex-1 rounded-lg border-2 border-[#667eea] px-4 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
    active
      ? 'bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white'
      : 'bg-white text-[#667eea] hover:bg-gray-50'
  }`;

const textInputClasses =
  'w-full rounded-lg border-2 border-gray-200 p-2.5 text-sm focus:border-[#667eea] focus:outline-none disabled:cursor-not-allowed disabled:opacity-60';

export function UploadForm({ loading, onSubmit, onFileSelected }: UploadFormProps) {
  const [values, setValues] = useState<UploadFormValues>(initialValues);
  const [touched, setTouched] = useState<Partial<Record<keyof UploadFormValues, boolean>>>({});
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');

  const errors = validate(values);
  const hasErrors = Boolean(errors.file || errors.lat || errors.lon || errors.minConf);

  const setField = <K extends keyof UploadFormValues>(field: K, value: UploadFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const markTouched = (field: keyof UploadFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.currentTarget.files?.[0] ?? null;
    setField('file', selectedFile);
    markTouched('file');
    if (selectedFile) onFileSelected?.();
  };

  const handleRecordingComplete = (file: File) => {
    setField('file', file);
    markTouched('file');
    onFileSelected?.();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTouched({ file: true, lat: true, lon: true, minConf: true });
    if (hasErrors) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-8 w-full max-w-[520px]">
      <div className="mb-5">
        <label className="mb-2 block font-semibold text-gray-800">Audio Source</label>
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            onClick={() => setInputMode('record')}
            disabled={loading}
            className={toggleButtonClasses(inputMode === 'record')}
          >
            🎤 Record Audio
          </button>
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            disabled={loading}
            className={toggleButtonClasses(inputMode === 'upload')}
          >
            📁 Upload File
          </button>
        </div>
      </div>

      <div className="mb-5">
        {inputMode === 'record' ? (
          <Recorder onRecordingComplete={handleRecordingComplete} disabled={loading} />
        ) : (
          <>
            <label htmlFor="file" className="mb-2 block font-semibold text-gray-800">
              Audio File
            </label>
            <input
              type="file"
              id="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={loading}
              className="w-full cursor-pointer rounded-lg border-2 border-dashed border-[#667eea] bg-gray-50 p-2.5 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {values.file && <p className="mt-2 text-sm font-medium text-green-600">Selected: {values.file.name}</p>}
          </>
        )}
        {touched.file && errors.file && <p className="mt-2 text-sm text-red-600">{errors.file}</p>}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="lat" className="mb-2 block font-semibold text-gray-800">
            Latitude (optional)
          </label>
          <input
            type="number"
            id="lat"
            step="any"
            value={values.lat}
            onChange={(event) => setField('lat', event.target.value)}
            onBlur={() => markTouched('lat')}
            placeholder="e.g., 35.4244"
            disabled={loading}
            className={textInputClasses}
          />
          {touched.lat && errors.lat && <p className="mt-2 text-sm text-red-600">{errors.lat}</p>}
        </div>

        <div>
          <label htmlFor="lon" className="mb-2 block font-semibold text-gray-800">
            Longitude (optional)
          </label>
          <input
            type="number"
            id="lon"
            step="any"
            value={values.lon}
            onChange={(event) => setField('lon', event.target.value)}
            onBlur={() => markTouched('lon')}
            placeholder="e.g., -120.7463"
            disabled={loading}
            className={textInputClasses}
          />
          {touched.lon && errors.lon && <p className="mt-2 text-sm text-red-600">{errors.lon}</p>}
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="minConf" className="mb-2 block font-semibold text-gray-800">
          Minimum Confidence
        </label>
        <input
          type="number"
          id="minConf"
          min="0"
          max="1"
          step="0.05"
          value={values.minConf}
          onChange={(event) => setField('minConf', event.target.value)}
          onBlur={() => markTouched('minConf')}
          disabled={loading}
          className={textInputClasses}
        />
        {touched.minConf && errors.minConf && <p className="mt-2 text-sm text-red-600">{errors.minConf}</p>}
      </div>

      <button
        type="submit"
        disabled={loading || hasErrors}
        className="w-full rounded-lg bg-gradient-to-br from-[#667eea] to-[#764ba2] p-3 font-semibold text-white transition hover:enabled:-translate-y-0.5 hover:enabled:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Analyzing...' : 'Analyze Audio'}
      </button>
    </form>
  );
}

export default UploadForm;
