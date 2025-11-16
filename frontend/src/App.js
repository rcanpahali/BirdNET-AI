import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [minConf, setMinConf] = useState(0.25);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResults(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);
    if (lat) formData.append('lat', lat);
    if (lon) formData.append('lon', lon);
    formData.append('min_conf', minConf);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🐦 Bird Sound Analyzer</h1>
          <p>Upload an audio file to detect bird species</p>
        </header>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="form-group">
            <label htmlFor="file">Audio File</label>
            <input
              type="file"
              id="file"
              accept="audio/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            {file && (
              <p className="file-info">Selected: {file.name}</p>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="lat">Latitude (optional)</label>
              <input
                type="number"
                id="lat"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="e.g., 35.4244"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="lon">Longitude (optional)</label>
              <input
                type="number"
                id="lon"
                step="any"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                placeholder="e.g., -120.7463"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="minConf">Minimum Confidence</label>
            <input
              type="number"
              id="minConf"
              min="0"
              max="1"
              step="0.05"
              value={minConf}
              onChange={(e) => setMinConf(parseFloat(e.target.value))}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading || !file} className="submit-btn">
            {loading ? 'Analyzing...' : 'Analyze Audio'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <div className="results">
            <h2>Analysis Results</h2>
            <p className="results-summary">
              Found <strong>{results.detection_count}</strong> detection{results.detection_count !== 1 ? 's' : ''} in <strong>{results.filename}</strong>
            </p>
            
            {results.detections.length === 0 ? (
              <p className="no-detections">No bird sounds detected with the current confidence threshold.</p>
            ) : (
              <div className="detections-list">
                {results.detections.map((detection, index) => (
                  <div key={index} className="detection-card">
                    <div className="detection-header">
                      <h3>{detection.common_name}</h3>
                      <span className="confidence">
                        {(detection.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="scientific-name">{detection.scientific_name}</p>
                    <div className="time-range">
                      <span>Time: {detection.start_time.toFixed(1)}s - {detection.end_time.toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

