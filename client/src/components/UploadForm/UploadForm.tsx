import React, { ChangeEvent, useState } from 'react';
import { Formik, Form, FormikHelpers, FormikErrors } from 'formik';
import styles from './UploadForm.module.css';
import Recorder from './Recorder';

export interface UploadFormValues {
  file: File | null;
  lat: string;
  lon: string;
  minConf: string;
}

interface UploadFormProps {
  loading: boolean;
  onSubmit: (values: UploadFormValues, formikHelpers: FormikHelpers<UploadFormValues>) => Promise<void> | void;
  onFileSelected?: () => void;
}

const initialValues: UploadFormValues = {
  file: null,
  lat: '',
  lon: '',
  minConf: '0.25',
};

const validate = (values: UploadFormValues): FormikErrors<UploadFormValues> => {
  const errors: FormikErrors<UploadFormValues> = {};

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
    const parsed = parseFloat(values.minConf);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      errors.minConf = 'Enter a value between 0 and 1';
    }
  }

  return errors;
};

const UploadForm: React.FC<UploadFormProps> = ({ loading, onSubmit, onFileSelected }) => {
  const [inputMode, setInputMode] = useState<'record' | 'upload'>('record');

  return (
    <Formik<UploadFormValues>
      initialValues={initialValues}
      validate={validate}
      onSubmit={async (values, formikHelpers) => {
        try {
          await onSubmit(values, formikHelpers);
        } finally {
          formikHelpers.setSubmitting(false);
        }
      }}
    >
    {({
      values,
      errors,
      touched,
      handleChange,
      handleBlur,
      setFieldValue,
      setFieldTouched,
      isSubmitting,
    }) => {
      const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.currentTarget.files?.[0] ?? null;
        void setFieldValue('file', selectedFile, true);
        setFieldTouched('file', true, false);
        if (selectedFile) {
          onFileSelected?.();
        }
      };

      const hasErrors = Boolean(errors.file || errors.lat || errors.lon || errors.minConf);

      return (
        <Form className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Audio Source</label>
            <div className={styles.inputModeToggle}>
              <button
                type="button"
                onClick={() => setInputMode('record')}
                className={inputMode === 'record' ? styles.toggleActive : styles.toggleInactive}
                disabled={loading || isSubmitting}
              >
                🎤 Record Audio
              </button>
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={inputMode === 'upload' ? styles.toggleActive : styles.toggleInactive}
                disabled={loading || isSubmitting}
              >
                📁 Upload File
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            {inputMode === 'record' ? (
              <Recorder
                onRecordingComplete={(file) => {
                  void setFieldValue('file', file, true);
                  setFieldTouched('file', true, false);
                  onFileSelected?.();
                }}
                disabled={loading || isSubmitting}
              />
            ) : (
              <>
                <label htmlFor="file" className={styles.label}>Audio File</label>
                <input
                  type="file"
                  id="file"
                  accept="audio/*"
                  onChange={handleFileChange}
                  disabled={loading || isSubmitting}
                  className={styles.fileInput}
                />
                {values.file && <p className={styles.fileInfo}>Selected: {values.file.name}</p>}
              </>
            )}
            {touched.file && errors.file && <p className={styles.errorText}>{errors.file}</p>}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="lat" className={styles.label}>Latitude (optional)</label>
              <input
                type="number"
                id="lat"
                name="lat"
                step="any"
                value={values.lat}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., 35.4244"
                disabled={loading || isSubmitting}
                className={styles.textInput}
              />
              {touched.lat && errors.lat && <p className={styles.errorText}>{errors.lat}</p>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lon" className={styles.label}>Longitude (optional)</label>
              <input
                type="number"
                id="lon"
                name="lon"
                step="any"
                value={values.lon}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g., -120.7463"
                disabled={loading || isSubmitting}
                className={styles.textInput}
              />
              {touched.lon && errors.lon && <p className={styles.errorText}>{errors.lon}</p>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="minConf" className={styles.label}>Minimum Confidence</label>
            <input
              type="number"
              id="minConf"
              name="minConf"
              min="0"
              max="1"
              step="0.05"
              value={values.minConf}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading || isSubmitting}
              className={styles.textInput}
            />
            {touched.minConf && errors.minConf && <p className={styles.errorText}>{errors.minConf}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || isSubmitting || hasErrors}
            className={styles.submitButton}
          >
            {loading || isSubmitting ? 'Analyzing...' : 'Analyze Audio'}
          </button>
        </Form>
      );
    }}
    </Formik>
  );
};

export default UploadForm;
export type { UploadFormProps };
