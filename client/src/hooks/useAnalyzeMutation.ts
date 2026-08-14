import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { analyzeAudio } from '../api/client';

export function useAnalyzeMutation() {
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      setUploadProgress(0);
      return analyzeAudio(formData, { onUploadProgress: setUploadProgress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
    onSettled: () => {
      setUploadProgress(null);
    },
  });

  return { ...mutation, uploadProgress };
}
