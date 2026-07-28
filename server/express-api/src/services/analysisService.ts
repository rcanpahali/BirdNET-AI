import type { Result } from 'neverthrow';
import type { Analysis, AnalysisStatus, Detection } from '@birdnet/types';
import {
  findAnalysis,
  listAnalysesWithDetections,
  saveAnalysis,
  updateAnalysisMetadata,
} from '../repositories/analysisRepository';
import { reverseGeocodeCity } from './geocodingService';
import type { DomainError } from '../errors';

interface RecordAnalysisInput {
  projectId: number;
  filename: string;
  mimetype: string;
  fileSize: number;
  lat?: number;
  lon?: number;
  minConf?: number;
  status: AnalysisStatus;
  errorMessage?: string;
  duration?: number;
  detections: Detection[];
}

export async function recordAnalysis(input: RecordAnalysisInput): Promise<number> {
  const city = input.lat !== undefined && input.lon !== undefined ? await reverseGeocodeCity(input.lat, input.lon) : null;
  return saveAnalysis({ ...input, city });
}

export function listRecentAnalyses(projectId: number, limit = 100): Analysis[] {
  return listAnalysesWithDetections(projectId, limit);
}

export function getAnalysis(id: number): Result<Analysis, DomainError> {
  return findAnalysis(id);
}

export function updateAnalysis(
  id: number,
  input: { tags?: string[]; notes?: string }
): Result<Analysis, DomainError> {
  return updateAnalysisMetadata(id, input);
}
