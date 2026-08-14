import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteAnalysis } from '../api/client';

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAnalysis(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['analyses'] }),
  });
}
