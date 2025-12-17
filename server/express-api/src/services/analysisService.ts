import db from '../db';
import { Detection } from '../types';

type SaveAnalysisInput = {
  filename: string;
  mimetype: string;
  fileSize: number;
  lat?: number;
  lon?: number;
  minConf?: number;
  detections: Detection[];
};

type AnalysisRowParams = {
  filename: string;
  mimetype: string;
  fileSize: number;
  lat: number | null;
  lon: number | null;
  minConf: number | null;
};

type DetectionRowParams = Detection & { analysisId: number };

const insertAnalysisStatement = db.prepare<AnalysisRowParams>(
  `INSERT INTO analyses (filename, mimetype, file_size, lat, lon, min_conf)
   VALUES (@filename, @mimetype, @fileSize, @lat, @lon, @minConf)`
);

const insertDetectionStatement = db.prepare<DetectionRowParams>(
  `INSERT INTO detections (analysis_id, common_name, scientific_name, confidence, start_time, end_time)
   VALUES (@analysisId, @common_name, @scientific_name, @confidence, @start_time, @end_time)`
);

export function saveAnalysisResult(payload: SaveAnalysisInput): number {
  const transaction = db.transaction((input: SaveAnalysisInput) => {
    const analysisResult = insertAnalysisStatement.run({
      filename: input.filename,
      mimetype: input.mimetype,
      fileSize: input.fileSize,
      lat: typeof input.lat === 'number' && Number.isFinite(input.lat) ? input.lat : null,
      lon: typeof input.lon === 'number' && Number.isFinite(input.lon) ? input.lon : null,
      minConf:
        typeof input.minConf === 'number' && Number.isFinite(input.minConf)
          ? input.minConf
          : null,
    });

    const analysisId = Number(analysisResult.lastInsertRowid);

    for (const detection of input.detections) {
      insertDetectionStatement.run({
        analysisId,
        ...detection,
      });
    }

    return analysisId;
  });

  return transaction(payload);
}

export function getAllAnalyses() {
  const analyses = db
    .prepare(
      `SELECT id, filename, mimetype, file_size, lat, lon, min_conf, created_at
       FROM analyses
       ORDER BY created_at DESC
       LIMIT 100`
    )
    .all();

  return analyses.map((analysis: any) => {
    const detections = db
      .prepare(
        `SELECT common_name, scientific_name, confidence, start_time, end_time
         FROM detections
         WHERE analysis_id = ?
         ORDER BY confidence DESC`
      )
      .all(analysis.id);

    return {
      id: analysis.id,
      filename: analysis.filename,
      mimetype: analysis.mimetype,
      fileSize: analysis.file_size,
      lat: analysis.lat,
      lon: analysis.lon,
      minConf: analysis.min_conf,
      createdAt: analysis.created_at,
      detectionCount: detections.length,
      detections,
    };
  });
}
