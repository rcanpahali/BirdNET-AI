import type { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { config } from '../config';
import { logger } from '../logger';

/**
 * Last-resort handler for errors that never went through a `DomainError` /
 * `Result` path: framework-level failures (Multer, body-parser) and genuinely
 * unexpected exceptions. Expected failure paths (validation, not-found,
 * upstream) are handled explicitly per-request via `respondWithError`, not
 * thrown-and-caught here.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum size: ${(config.maxFileSize / 1024 / 1024).toFixed(1)}MB`
        : err.message;
    logger.warn({ message }, 'Upload rejected');
    res.status(400).json({ error: 'validation', message });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'not_found', message: 'Not found' });
}
