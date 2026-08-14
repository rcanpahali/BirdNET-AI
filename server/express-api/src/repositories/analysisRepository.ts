import { eq } from 'drizzle-orm';
import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Analysis, AnalysisStatus, Detection } from '@birdnet/types';
import { db } from '../db/client';
import { analyses, detections } from '../db/schema';
import { notFoundError } from '../errors';
import type { DomainError } from '../errors';

interface SaveAnalysisInput {
  projectId: number;
  filename: string;
  mimetype: string;
  fileSize: number;
  lat?: number;
  lon?: number;
  city?: string | null;
  minConf?: number;
  status: AnalysisStatus;
  errorMessage?: string;
  duration?: number;
  detections: Detection[];
}

interface UpdateAnalysisMetadataInput {
  tags?: string[];
  notes?: string;
}

interface AnalysisRow {
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
  tags: string[] | null;
  notes: string | null;
  createdAt: string;
  detections: {
    commonName: string;
    scientificName: string;
    confidence: number;
    startTime: number;
    endTime: number;
  }[];
}

function toAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    projectId: row.projectId,
    filename: row.filename,
    mimetype: row.mimetype,
    fileSize: row.fileSize,
    lat: row.lat,
    lon: row.lon,
    city: row.city,
    minConf: row.minConf,
    status: row.status,
    errorMessage: row.errorMessage,
    duration: row.duration,
    tags: row.tags ?? [],
    notes: row.notes,
    createdAt: row.createdAt,
    detectionCount: row.detections.length,
    detections: row.detections.map((detection) => ({
      common_name: detection.commonName,
      scientific_name: detection.scientificName,
      confidence: detection.confidence,
      start_time: detection.startTime,
      end_time: detection.endTime,
    })),
  };
}

export function saveAnalysis(input: SaveAnalysisInput): number {
  return db.transaction((tx) => {
    const [inserted] = tx
      .insert(analyses)
      .values({
        projectId: input.projectId,
        filename: input.filename,
        mimetype: input.mimetype,
        fileSize: input.fileSize,
        lat: input.lat ?? null,
        lon: input.lon ?? null,
        city: input.city ?? null,
        minConf: input.minConf ?? null,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        duration: input.duration ?? null,
      })
      .returning({ id: analyses.id })
      .all();

    if (input.detections.length > 0) {
      tx.insert(detections)
        .values(
          input.detections.map((detection) => ({
            analysisId: inserted.id,
            commonName: detection.common_name,
            scientificName: detection.scientific_name,
            confidence: detection.confidence,
            startTime: detection.start_time,
            endTime: detection.end_time,
          }))
        )
        .run();
    }

    return inserted.id;
  });
}

// Single query via Drizzle's relational API instead of 1 + N queries per analysis.
export function listAnalysesWithDetections(projectId: number, limit = 100): Analysis[] {
  const rows = db.query.analyses
    .findMany({
      where: eq(analyses.projectId, projectId),
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      limit,
      with: {
        detections: {
          orderBy: (fields, { desc }) => desc(fields.confidence),
        },
      },
    })
    .sync();

  return rows.map(toAnalysis);
}

export function findAnalysis(id: number): Result<Analysis, DomainError> {
  const row = db.query.analyses
    .findFirst({
      where: eq(analyses.id, id),
      with: {
        detections: {
          orderBy: (fields, { desc }) => desc(fields.confidence),
        },
      },
    })
    .sync();

  if (!row) return err(notFoundError(`Analysis ${id} not found`));
  return ok(toAnalysis(row));
}

export function deleteAnalysis(id: number): Result<void, DomainError> {
  const result = db.delete(analyses).where(eq(analyses.id, id)).run();
  if (result.changes === 0) return err(notFoundError(`Analysis ${id} not found`));
  return ok(undefined);
}

export function updateAnalysisMetadata(id: number, input: UpdateAnalysisMetadataInput): Result<Analysis, DomainError> {
  const values: Partial<{ tags: string[]; notes: string | null }> = {};
  if (input.tags !== undefined) values.tags = input.tags;
  if (input.notes !== undefined) values.notes = input.notes;

  if (Object.keys(values).length > 0) {
    db.update(analyses).set(values).where(eq(analyses.id, id)).run();
  }

  return findAnalysis(id);
}
