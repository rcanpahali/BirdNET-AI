import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAnalysis } from '../api/client';
import type { UpdateAnalysisInput } from '../api/client';

export function useUpdateAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateAnalysisInput }) => updateAnalysis(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analyses'] }),
  });
}
