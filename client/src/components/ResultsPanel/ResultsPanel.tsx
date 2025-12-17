import React from 'react';
import DetectionCard from '../DetectionCard';
import styles from './ResultsPanel.module.css';
import type { AnalyzerResponse } from '../../types';

interface ResultsPanelProps {
  results: AnalyzerResponse;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ results }) => {
  const { detection_count: detectionCount, filename, detections } = results;

  return (
    <div className={styles.results}>
      <h2 className={styles.title}>Analysis Results</h2>
      <p className={styles.summary}>
        Found <strong>{detectionCount}</strong> detection{detectionCount !== 1 ? 's' : ''} in{' '}
        <strong>{filename}</strong>
      </p>

      {detections.length === 0 ? (
        <p className={styles.noDetections}>
          No bird sounds detected with the current confidence threshold.
        </p>
      ) : (
        <div className={styles.detectionsList}>
          {detections.map((detection, index) => (
            <DetectionCard
              key={`${detection.common_name}-${detection.start_time}-${index}`}
              detection={detection}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultsPanel;
