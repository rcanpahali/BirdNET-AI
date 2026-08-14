import axios from 'axios';
import type { AxiosProgressEvent } from 'axios';
import type { Analysis, AnalyzerResponse, Project } from '@birdnet/types';
import { i18n } from '../i18n';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const apiClient = axios.create({ baseURL: API_URL });

export interface AnalyzeAudioOptions {
  onUploadProgress?: (percent: number) => void;
}

export async function analyzeAudio(formData: FormData, options?: AnalyzeAudioOptions): Promise<AnalyzerResponse> {
  const { data } = await apiClient.post<AnalyzerResponse>('/analyze', formData, {
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (!options?.onUploadProgress || !event.total) return;
      options.onUploadProgress(Math.round((event.loaded / event.total) * 100));
    },
  });
  return data;
}

export async function fetchAnalyses(projectId: number): Promise<Analysis[]> {
  const { data } = await apiClient.get<Analysis[]>('/analyses', { params: { projectId } });
  return data;
}

export interface UpdateAnalysisInput {
  tags?: string[];
  notes?: string;
}

export async function updateAnalysis(id: number, input: UpdateAnalysisInput): Promise<Analysis> {
  const { data } = await apiClient.patch<Analysis>(`/analyses/${id}`, input);
  return data;
}

export async function deleteAnalysis(id: number): Promise<void> {
  await apiClient.delete(`/analyses/${id}`);
}

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await apiClient.get<Project[]>('/projects');
  return data;
}

export interface ProjectInput {
  name: string;
  description?: string;
  targetLocation?: string;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const { data } = await apiClient.post<Project>('/projects', input);
  return data;
}

export async function updateProject(id: number, input: Partial<ProjectInput>): Promise<Project> {
  const { data } = await apiClient.patch<Project>(`/projects/${id}`, input);
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string } | undefined)?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
    return error.message || i18n.t('errors.generic');
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return i18n.t('errors.generic');
}
