import React from 'react';
import styles from './PastRecordsPanel.module.css';
import DetectionItem from './DetectionItem';

interface Detection {
  common_name: string;
  scientific_name: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

interface DetectionListProps {
  detections: Detection[];
}

const DetectionList: React.FC<DetectionListProps> = ({ detections }) => {
  return (
    <ul className={styles.detections}>
      {detections.map((detection, idx) => (
        <DetectionItem key={idx} detection={detection} />
      ))}
    </ul>
  );
};

export default DetectionList;
