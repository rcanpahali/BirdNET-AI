import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './PastRecordsPanel.module.css';
import AnalysisListItem from './AnalysisListItem';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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

interface PastRecordsPanelProps {
  refreshTrigger?: number;
}

const PastRecordsPanel: React.FC<PastRecordsPanelProps> = ({ refreshTrigger }) => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchAnalyses = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Analysis[]>(`${API_URL}/analyses`);
      setAnalyses(response.data);
    } catch (error) {
      console.error('Failed to fetch analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchAnalyses();
    }
  }, [refreshTrigger]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.content}>
        <h2 className={styles.title}>Analysis History</h2>
        
        {loading && <p className={styles.loading}>Loading...</p>}
        
        {!loading && analyses.length === 0 && (
          <p className={styles.empty}>No analyses yet</p>
        )}
        
        {!loading && analyses.length > 0 && (
          <ul className={styles.list}>
            {analyses.map((analysis) => (
              <AnalysisListItem
                key={analysis.id}
                analysis={analysis}
                isExpanded={expandedId === analysis.id}
                onToggle={() => toggleExpand(analysis.id)}
                formatDate={formatDate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PastRecordsPanel;
