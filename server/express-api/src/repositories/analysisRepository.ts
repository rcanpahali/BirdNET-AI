import type { Analysis, Detection } from '@birdnet/types';
import { db } from '../db/client';
import { analyses, detections } from '../db/schema';

interface SaveAnalysisInput {
  filename: string;
  mimetype: string;
  fileSize: number;
  lat?: number;
  lon?: number;
  minConf?: number;
  detections: Detection[];
}

export function saveAnalysis(input: SaveAnalysisInput): number {
  return db.transaction((tx) => {
    const [inserted] = tx
      .insert(analyses)
      .values({
        filename: input.filename,
        mimetype: input.mimetype,
        fileSize: input.fileSize,
        lat: input.lat ?? null,
        lon: input.lon ?? null,
        minConf: input.minConf ?? null,
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
export function listAnalysesWithDetections(limit = 100): Analysis[] {
  const rows = db.query.analyses
    .findMany({
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      limit,
      with: {
        detections: {
          orderBy: (fields, { desc }) => desc(fields.confidence),
        },
      },
    })
    .sync();

  return rows.map((row) => ({
    id: row.id,
    filename: row.filename,
    mimetype: row.mimetype,
    fileSize: row.fileSize,
    lat: row.lat,
    lon: row.lon,
    minConf: row.minConf,
    createdAt: row.createdAt,
    detectionCount: row.detections.length,
    detections: row.detections.map((detection) => ({
      common_name: detection.commonName,
      scientific_name: detection.scientificName,
      confidence: detection.confidence,
      start_time: detection.startTime,
      end_time: detection.endTime,
    })),
  }));
}
