import type { Result } from 'neverthrow';
import type { Project } from '@birdnet/types';
import {
  createProject as createProjectRow,
  deleteProject as deleteProjectRow,
  findProject,
  listProjects as listProjectRows,
  updateProject as updateProjectRow,
} from '../repositories/projectRepository';
import type { DomainError } from '../errors';
import type { CreateProjectInput, UpdateProjectInput } from '../validation/project.schema';

export function listProjects(): Project[] {
  return listProjectRows();
}

export function getProject(id: number): Result<Project, DomainError> {
  return findProject(id);
}

export function createProject(input: CreateProjectInput): Project {
  return createProjectRow(input);
}

export function updateProject(id: number, input: UpdateProjectInput): Result<Project, DomainError> {
  return updateProjectRow(id, input);
}

export function deleteProject(id: number): Result<void, DomainError> {
  return deleteProjectRow(id);
}
