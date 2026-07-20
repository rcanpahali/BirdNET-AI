import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { config } from '../config';
import { AppError, UpstreamError } from '../errors';
import { logger } from '../logger';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error({ err }, err.message);
    } else {
      logger.warn({ message: err.message }, 'Request rejected');
    }

    const payload: Record<string, unknown> = { error: err.code, message: err.message };
    if (err instanceof UpstreamError && err.upstreamBody !== undefined) {
      payload.upstream = err.upstreamBody;
    }

    res.status(err.status).json(payload);
    return;
  }

  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`
        : err.message;
    logger.warn({ message }, 'Upload rejected');
    res.status(400).json({ error: 'validation_error', message });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'not_found', message: 'Not found' });
}
