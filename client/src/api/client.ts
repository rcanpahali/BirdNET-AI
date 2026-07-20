import axios from 'axios';
import type { Analysis, AnalyzerResponse } from '@birdnet/types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const apiClient = axios.create({ baseURL: API_URL });

export async function analyzeAudio(formData: FormData): Promise<AnalyzerResponse> {
  const { data } = await apiClient.post<AnalyzerResponse>('/analyze', formData);
  return data;
}

export async function fetchAnalyses(): Promise<Analysis[]> {
  const { data } = await apiClient.get<Analysis[]>('/analyses');
  return data;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    return error.message || 'An error occurred';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An error occurred';
}
