import { z } from 'zod';

export const updateAnalysisSchema = z.object({
  tags: z.array(z.string().trim().min(1)).optional(),
  notes: z.string().optional(),
});

export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;
