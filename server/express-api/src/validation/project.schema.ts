import { z } from 'zod';

function trimmedOptional(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required'),
  description: z.preprocess(trimmedOptional, z.string().optional()),
  targetLocation: z.preprocess(trimmedOptional, z.string().optional()),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required').optional(),
  description: z.preprocess(trimmedOptional, z.string().optional()),
  targetLocation: z.preprocess(trimmedOptional, z.string().optional()),
});

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
