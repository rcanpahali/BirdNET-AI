import fs from 'node:fs/promises';
import path from 'node:path';
import type { Request, Response } from 'express';
import { config } from '../config';
import { ValidationError } from '../errors';
import { logger } from '../logger';
import { recordAnalysis } from '../services/analysisService';
import { analyzeUpstream } from '../services/birdnetClient';
import { analyzeFormSchema } from '../validation/analyzeRequest.schema';

export async function analyzeController(req: Request, res: Response): Promise<void> {
  const file = req.file;

  try {
    if (!file) {
      throw new ValidationError('No file uploaded');
    }

    const fileExt = path.extname(file.originalname).toLowerCase();
    if (!config.allowedExtensions.includes(fileExt)) {
      throw new ValidationError(
        `Unsupported file format: ${fileExt}. Allowed formats: ${config.allowedExtensions.join(', ')}`
      );
    }

    const parsedFields = analyzeFormSchema.safeParse(req.body);
    if (!parsedFields.success) {
      throw new ValidationError('Invalid request parameters', parsedFields.error.flatten());
    }

    const { lat, lon, min_conf: minConf } = parsedFields.data;

    const result = await analyzeUpstream({
      filePath: file.path,
      originalName: file.originalname,
      mimetype: file.mimetype,
      lat,
      lon,
      minConf,
    });

    recordAnalysis({
      filename: file.originalname,
      mimetype: file.mimetype,
      fileSize: file.size,
      lat,
      lon,
      minConf,
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
