import { eq } from 'drizzle-orm';
import { err, ok } from 'neverthrow';
import type { Result } from 'neverthrow';
import type { Project } from '@birdnet/types';
import { db } from '../db/client';
import { projects } from '../db/schema';
import { notFoundError } from '../errors';
import type { DomainError } from '../errors';
import type { CreateProjectInput, UpdateProjectInput } from '../validation/project.schema';

interface ProjectRow {
  id: number;
  name: string;
  description: string | null;
  targetLocation: string | null;
  createdAt: string;
  analyses: { id: number }[];
}

function toProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    targetLocation: row.targetLocation,
    createdAt: row.createdAt,
    recordingCount: row.analyses.length,
  };
}

export function createProject(input: CreateProjectInput): Project {
  const [inserted] = db
    .insert(projects)
    .values({
      name: input.name,
      description: input.description ?? null,
      targetLocation: input.targetLocation ?? null,
    })
    .returning()
    .all();

  return { ...inserted, recordingCount: 0 };
}

export function listProjects(): Project[] {
  const rows = db.query.projects
    .findMany({
      orderBy: (fields, { desc }) => desc(fields.createdAt),
      with: { analyses: { columns: { id: true } } },
    })
    .sync();

  return rows.map(toProject);
}

export function findProject(id: number): Result<Project, DomainError> {
  const row = db.query.projects
    .findFirst({
      where: eq(projects.id, id),
      with: { analyses: { columns: { id: true } } },
    })
    .sync();

  if (!row) return err(notFoundError(`Project ${id} not found`));
  return ok(toProject(row));
}

export function updateProject(id: number, input: UpdateProjectInput): Result<Project, DomainError> {
  const values: Partial<{ name: string; description: string | null; targetLocation: string | null }> = {};
  if (input.name !== undefined) values.name = input.name;
  if (input.description !== undefined) values.description = input.description;
  if (input.targetLocation !== undefined) values.targetLocation = input.targetLocation;

  if (Object.keys(values).length > 0) {
    db.update(projects).set(values).where(eq(projects.id, id)).run();
  }

  return findProject(id);
}

export function deleteProject(id: number): Result<void, DomainError> {
  const result = db.delete(projects).where(eq(projects.id, id)).run();
  if (result.changes === 0) return err(notFoundError(`Project ${id} not found`));
  return ok(undefined);
}
