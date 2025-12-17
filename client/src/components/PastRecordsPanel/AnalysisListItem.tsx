import React from 'react';
import styles from './PastRecordsPanel.module.css';
import DetectionList from './DetectionList';

interface Detection {
  common_name: string;
  scientific_name: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

interface Analysis {
  id: number;
  filename: string;
  createdAt: string;
  detectionCount: number;
  detections: Detection[];
}

interface AnalysisListItemProps {
  analysis: Analysis;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (dateString: string) => string;
}

const AnalysisListItem: React.FC<AnalysisListItemProps> = ({
  analysis,
  isExpanded,
  onToggle,
  formatDate,
}) => {
  return (
    <li className={styles.item}>
      <button className={styles.itemHeader} onClick={onToggle}>
        <div className={styles.itemInfo}>
          <div className={styles.filename}>{analysis.filename}</div>
          <div className={styles.meta}>{formatDate(analysis.createdAt)}</div>
          <div className={styles.count}>
            {analysis.detectionCount} detection{analysis.detectionCount !== 1 ? 's' : ''}
          </div>
        </div>
        <span className={styles.expandIcon}>{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && analysis.detections.length > 0 && (
        <DetectionList detections={analysis.detections} />
      )}
    </li>
  );
};

export default AnalysisListItem;
