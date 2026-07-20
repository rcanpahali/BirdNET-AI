import type { Analysis, Detection } from '@birdnet/types';
import { listAnalysesWithDetections, saveAnalysis } from '../repositories/analysisRepository';

interface RecordAnalysisInput {
  filename: string;
  mimetype: string;
  fileSize: number;
  lat?: number;
  lon?: number;
  minConf?: number;
  detections: Detection[];
}

export function recordAnalysis(input: RecordAnalysisInput): number {
  return saveAnalysis(input);
}

export function listRecentAnalyses(limit = 100): Analysis[] {
  return listAnalysesWithDetections(limit);
}
