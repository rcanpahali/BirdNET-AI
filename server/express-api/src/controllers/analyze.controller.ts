import fs from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { config } from '../config';
import { validationError } from '../errors';
import { respondWithError } from '../http/respondWithError';
import { logger } from '../logger';
import { recordAnalysis } from '../services/analysisService';
import { getProject } from '../services/projectService';
import { analyzeUpstream } from '../services/birdnetClient';
import { analyzeFormSchema } from '../validation/analyzeRequest.schema';
import { parseOrError } from '../validation/parse';

export async function analyzeController(req: Request, res: Response): Promise<void> {
  const file = req.file;

  try {
    if (!file) {
      respondWithError(res, validationError('No file uploaded'));
      return;
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(fileExt)) {
      respondWithError(
        res,
        validationError(`Unsupported file format: ${fileExt}. Allowed formats: ${config.allowedExtensions.join(', ')}`)
      );
      return;
    }

    const fieldsResult = parseOrError(analyzeFormSchema, req.body);
    if (fieldsResult.isErr()) {
      respondWithError(res, fieldsResult.error);
      return;
    }
    const { project_id: projectId, lat, lon, min_conf: minConf } = fieldsResult.value;

    // Validated up front so a failed analysis (below) still has a real project to
    // record the failure against.
    const projectResult = getProject(projectId);
    if (projectResult.isErr()) {
      respondWithError(res, projectResult.error);
      return;
    }

    // lat/lon are stored for the analysis history/map, not sent upstream -- BirdNET's
    // location-based species filtering excludes anything outside the recording's
    // region, which is wrong for arbitrary uploads that weren't recorded on-site.
    const analysisResult = await analyzeUpstream({
      filePath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      minConf,
    });

    if (analysisResult.isErr()) {
      await recordAnalysis({
        projectId,
        filename: file.originalname,
        mimetype: file.mimetype,
        fileSize: file.size,
        lat,
        lon,
        minConf,
        status: 'failed',
        errorMessage: analysisResult.error.message,
        detections: [],
      });
      respondWithError(res, analysisResult.error);
      return;
    }

    const result = analysisResult.value;

    await recordAnalysis({
      projectId,
      filename: file.originalname,
      mimetype: file.mimetype,
      fileSize: file.size,
      lat,
      lon,
      minConf,
      status: 'completed',
      duration: result.duration_seconds,
      detections: result.detections,
    });

    res.json(result);
  } finally {
    if (file) {
      try {
        await fs.unlink(file.path);
      } catch (err) {
        logger.warn({ err }, 'Failed to remove temp upload file');
      }
    }
  }
}
