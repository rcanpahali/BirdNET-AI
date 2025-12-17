import React from 'react';
import styles from './PastRecordsPanel.module.css';

interface Detection {
  common_name: string;
  scientific_name: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

interface DetectionItemProps {
  detection: Detection;
}

const DetectionItem: React.FC<DetectionItemProps> = ({ detection }) => {
  return (
    <li className={styles.detection}>
      <div className={styles.detectionName}>{detection.common_name}</div>
      <div className={styles.detectionScientific}>{detection.scientific_name}</div>
      <div className={styles.detectionDetails}>
        Confidence: {(detection.confidence * 100).toFixed(1)}% |{' '}
        {detection.start_time.toFixed(1)}s - {detection.end_time.toFixed(1)}s
      </div>
    </li>
  );
};

export default DetectionItem;
