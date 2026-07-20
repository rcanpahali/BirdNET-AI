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
}

export interface Analysis {
  id: number;
  filename: string;
  mimetype: string;
  fileSize: number;
  lat: number | null;
  lon: number | null;
  minConf: number | null;
  createdAt: string;
  detectionCount: number;
  detections: Detection[];
}
