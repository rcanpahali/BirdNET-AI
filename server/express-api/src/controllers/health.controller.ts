import type { Request, Response } from 'express';
import { config } from '../config';
import { respondWithError } from '../http/respondWithError';
import { checkUpstreamHealth } from '../services/birdnetClient';

export async function rootController(_req: Request, res: Response): Promise<void> {
  res.json({ message: 'BirdNet API', upstream: config.birdnetApiUrl });
}

export async function healthController(_req: Request, res: Response): Promise<void> {
  const result = await checkUpstreamHealth();
  result.match(
    (upstream) => res.json(upstream),
    (error) => respondWithError(res, error)
  );
}
