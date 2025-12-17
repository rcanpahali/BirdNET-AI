import React from 'react';
import styles from './DetectionCard.module.css';
import type { Detection } from '../../types';

interface DetectionCardProps {
  detection: Detection;
}

const DetectionCard: React.FC<DetectionCardProps> = ({ detection }) => {
  const {
    common_name: commonName,
    scientific_name: scientificName,
    confidence,
    start_time: startTime,
    end_time: endTime,
  } = detection;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.commonName}>{commonName}</h3>
        <span className={styles.confidence}>{(confidence * 100).toFixed(1)}%</span>
      </div>
      <p className={styles.scientificName}>{scientificName}</p>
      <div className={styles.timeRange}>
        <span>
          Time: {startTime.toFixed(1)}s - {endTime.toFixed(1)}s
        </span>
      </div>
    </div>
  );
};

export default DetectionCard;
