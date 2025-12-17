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
