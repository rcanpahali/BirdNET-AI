import React, { useState } from 'react';
import axios from 'axios';
import layoutStyles from './layout.module.css';
import UploadForm, { UploadFormValues } from './components/UploadForm';
import ResultsPanel from './components/ResultsPanel';
import { AnalyzerResponse } from './types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
const FALLBACK_ERROR = 'An error occurred';

const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    return err.message || FALLBACK_ERROR;
  }

  if (err instanceof Error && err.message) {
    return err.message;
  }

  return FALLBACK_ERROR;
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalyzerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = () => {
    setError(null);
    setResults(null);
  };

  const handleSubmit = async (values: UploadFormValues) => {
    if (!values.file) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', values.file);
    if (values.lat) formData.append('lat', values.lat);
    if (values.lon) formData.append('lon', values.lon);

    const parsedMinConf = parseFloat(values.minConf);
    formData.append('min_conf', String(Number.isFinite(parsedMinConf) ? parsedMinConf : 0.25));

    try {
      const response = await axios.post<AnalyzerResponse>(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={layoutStyles.app}>
      <div className={layoutStyles.container}>
        <header className={layoutStyles.header}>
          <h1 className={layoutStyles.title}>BirdNET Analyzer</h1>
          <p className={layoutStyles.subtitle}>Upload an audio file to detect bird species</p>
        </header>

        <UploadForm loading={loading} onSubmit={handleSubmit} onFileSelected={handleFileSelected} />

        {error && (
          <div className={layoutStyles.errorMessage}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && <ResultsPanel results={results} />}
      </div>
    </div>
  );
};

export default App;
