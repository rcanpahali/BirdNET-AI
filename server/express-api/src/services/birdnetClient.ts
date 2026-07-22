import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import type { AnalyzerResponse } from '@birdnet/types';
import { config } from '../config';
import { UpstreamError } from '../errors';

interface AnalyzeUpstreamParams {
  filePath: string;
  originalName: string;
  mimetype: string;
  minConf?: number;
}

// Streams the file straight from disk into the outgoing request instead of
// holding it in memory a second time.
export async function analyzeUpstream(params: AnalyzeUpstreamParams): Promise<AnalyzerResponse> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(params.filePath), {
    filename: params.originalName,
    contentType: params.mimetype,
  });

  const query: Record<string, string> = {};
  if (params.minConf !== undefined) query.min_conf = String(params.minConf);

  try {
    const response = await axios.post<AnalyzerResponse>(`${config.birdnetApiUrl}/analyze`, formData, {
      headers: formData.getHeaders(),
      params: query,
      timeout: config.analyzeTimeoutMs,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    throw toUpstreamError(error, 'Analysis request to the BirdNET service failed');
  }
}

export async function checkUpstreamHealth(): Promise<unknown> {
  try {
    const response = await axios.get(`${config.birdnetApiUrl}/health`, { timeout: config.healthTimeoutMs });
    return response.data;
  } catch (error) {
    throw toUpstreamError(error, 'Failed to reach the BirdNET service');
  }
}

function toUpstreamError(error: unknown, fallbackMessage: string): UpstreamError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 502;
    const body = error.response?.data as { message?: unknown } | undefined;
    const message = typeof body?.message === 'string' ? body.message : fallbackMessage;
    return new UpstreamError(status, message, body);
  }

  return new UpstreamError(502, fallbackMessage);
}
