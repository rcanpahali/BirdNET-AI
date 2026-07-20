import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyzeAudio } from '../api/client';

export function useAnalyzeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: analyzeAudio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}
