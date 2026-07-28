export interface Detection {
  common_name: string;
  scientific_name: string;
  confidence: number;
  start_time: number;
  end_time: number;
}

export interface AnalyzerResponse {
  filename: string;
  detection_count: number;
  detections: Detection[];
  analysis_time_seconds?: number;
  duration_seconds?: number;
  /** Set by Express once the analysis is persisted; absent on the raw upstream FastAPI payload. */
  id?: number;
}

export type AnalysisStatus = 'completed' | 'failed';

export interface Analysis {
  id: number;
  projectId: number;
  filename: string;
  mimetype: string;
  fileSize: number;
  lat: number | null;
  lon: number | null;
  city: string | null;
  minConf: number | null;
  status: AnalysisStatus;
  errorMessage: string | null;
  duration: number | null;
  tags: string[];
  notes: string | null;
  createdAt: string;
  detectionCount: number;
  detections: Detection[];
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  targetLocation: string | null;
  createdAt: string;
  recordingCount: number;
}
