import type { Response } from 'express';
import type { DomainError } from '../errors';
import { logger } from '../logger';

function statusFor(error: DomainError): number {
  switch (error.kind) {
    case 'validation':
      return 400;
    case 'not_found':
      return 404;
    case 'upstream':
      return error.status;
  }
}

export function respondWithError(res: Response, error: DomainError): void {
  const status = statusFor(error);

  if (status >= 500) {
    logger.error({ err: error }, error.message);
  } else {
    logger.warn({ message: error.message }, 'Request rejected');
  }

  const body: Record<string, unknown> = { error: error.kind, message: error.message };
  if (error.kind === 'validation' && error.details !== undefined) body.details = error.details;
  if (error.kind === 'upstream' && error.upstreamBody !== undefined) body.upstream = error.upstreamBody;

  res.status(status).json(body);
}
