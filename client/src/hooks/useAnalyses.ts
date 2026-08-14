import { useQuery } from '@tanstack/react-query';
import { fetchAnalyses } from '../api/client';

export function useAnalyses(projectId: number | undefined) {
  return useQuery({
    queryKey: ['analyses', projectId],
    queryFn: () => fetchAnalyses(projectId!),
    enabled: projectId !== undefined,
  });
}
