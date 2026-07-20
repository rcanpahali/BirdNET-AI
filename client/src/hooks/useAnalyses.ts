import { useQuery } from '@tanstack/react-query';
import { fetchAnalyses } from '../api/client';

export function useAnalyses() {
  return useQuery({ queryKey: ['analyses'], queryFn: fetchAnalyses });
}
