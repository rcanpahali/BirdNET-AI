import type { Request, Response } from 'express';
import { respondWithError } from '../http/respondWithError';
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../services/projectService';
import { parseIdParam, parseOrError } from '../validation/parse';
import { createProjectSchema, updateProjectSchema } from '../validation/project.schema';

export async function listProjectsController(_req: Request, res: Response): Promise<void> {
  res.json(listProjects());
}

export async function getProjectController(req: Request, res: Response): Promise<void> {
  parseIdParam(req.params.id)
    .andThen((id) => getProject(id))
    .match(
      (project) => res.json(project),
      (error) => respondWithError(res, error)
    );
}

export async function createProjectController(req: Request, res: Response): Promise<void> {
  parseOrError(createProjectSchema, req.body).match(
    (input) => res.status(201).json(createProject(input)),
    (error) => respondWithError(res, error)
  );
}

export async function updateProjectController(req: Request, res: Response): Promise<void> {
  const idResult = parseIdParam(req.params.id);
  const bodyResult = parseOrError(updateProjectSchema, req.body);

  idResult
    .andThen((id) => bodyResult.map((input) => ({ id, input })))
    .andThen(({ id, input }) => updateProject(id, input))
    .match(
      (project) => res.json(project),
      (error) => respondWithError(res, error)
    );
}

export async function deleteProjectController(req: Request, res: Response): Promise<void> {
  parseIdParam(req.params.id)
    .andThen((id) => deleteProject(id))
    .match(
      () => res.status(204).send(),
      (error) => respondWithError(res, error)
    );
}
