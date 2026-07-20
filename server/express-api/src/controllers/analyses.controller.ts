import type { Request, Response } from 'express';
import { listRecentAnalyses } from '../services/analysisService';

export async function listAnalysesController(_req: Request, res: Response): Promise<void> {
  res.json(listRecentAnalyses());
}
