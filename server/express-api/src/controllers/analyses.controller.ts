import type { Request, Response } from 'express';
import { respondWithError } from '../http/respondWithError';
import { deleteAnalysis, listRecentAnalyses, updateAnalysis } from '../services/analysisService';
import { parseIdParam, parseOrError } from '../validation/parse';
import { updateAnalysisSchema } from '../validation/updateAnalysis.schema';

export async function listAnalysesController(req: Request, res: Response): Promise<void> {
  parseIdParam(req.query.projectId as string | string[] | undefined)
    .map((projectId) => listRecentAnalyses(projectId))
    .match(
      (list) => res.json(list),
      (error) => respondWithError(res, error)
    );
}

export async function updateAnalysisController(req: Request, res: Response): Promise<void> {
  const idResult = parseIdParam(req.params.id);
  const bodyResult = parseOrError(updateAnalysisSchema, req.body);

  idResult
    .andThen((id) => bodyResult.map((input) => ({ id, input })))
    .andThen(({ id, input }) => updateAnalysis(id, input))
    .match(
      (analysis) => res.json(analysis),
      (error) => respondWithError(res, error)
    );
}

export async function deleteAnalysisController(req: Request, res: Response): Promise<void> {
  parseIdParam(req.params.id)
    .andThen((id) => deleteAnalysis(id))
    .match(
      () => res.status(204).send(),
      (error) => respondWithError(res, error)
    );
}
