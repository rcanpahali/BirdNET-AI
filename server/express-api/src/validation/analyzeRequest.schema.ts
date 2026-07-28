import { z } from 'zod';

function cleanNumericInput(val: unknown): string | undefined {
  if (typeof val !== 'string') return undefined;
  const trimmed = val.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

const latSchema = z.preprocess(cleanNumericInput, z.coerce.number().finite().min(-90).max(90).optional());
const lonSchema = z.preprocess(cleanNumericInput, z.coerce.number().finite().min(-180).max(180).optional());
const minConfSchema = z.preprocess(cleanNumericInput, z.coerce.number().finite().min(0).max(1).optional());
const projectIdSchema = z.preprocess(cleanNumericInput, z.coerce.number().int().positive());

export const analyzeFormSchema = z.object({
  project_id: projectIdSchema,
  lat: latSchema,
  lon: lonSchema,
  min_conf: minConfSchema,
});

export type AnalyzeFormFields = z.infer<typeof analyzeFormSchema>;
