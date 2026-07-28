import fs from 'node:fs';
import axios from 'axios';
import FormData from 'form-data';
import { ResultAsync } from 'neverthrow';
import type { AnalyzerResponse } from '@birdnet/types';
import { config } from '../config';
import { upstreamError } from '../errors';
import type { DomainError } from '../errors';

interface AnalyzeUpstreamParams {
  filePath: string;
  originalName: string;
  mimetype: string;
  minConf?: number;
}

// Streams the file straight from disk into the outgoing request instead of
// holding it in memory a second time.
export function analyzeUpstream(params: AnalyzeUpstreamParams): ResultAsync<AnalyzerResponse, DomainError> {
  const formData = new FormData();
  formData.append('file', fs.createReadStream(params.filePath), {
    filename: params.originalName,
    contentType: params.mimetype,
  });

  const query: Record<string, string> = {};
  if (params.minConf !== undefined) query.min_conf = String(params.minConf);

  return ResultAsync.fromPromise(
    axios.post<AnalyzerResponse>(`${config.birdnetApiUrl}/analyze`, formData, {
      headers: formData.getHeaders(),
      params: query,
      timeout: config.analyzeTimeoutMs,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    }),
    (error) => toUpstreamError(error, 'Analysis request to the BirdNET service failed')
  ).map((response) => response.data);
}

export function checkUpstreamHealth(): ResultAsync<unknown, DomainError> {
  return ResultAsync.fromPromise(
    axios.get(`${config.birdnetApiUrl}/health`, { timeout: config.healthTimeoutMs }),
    (error) => toUpstreamError(error, 'Failed to reach the BirdNET service')
  ).map((response) => response.data);
}

function toUpstreamError(error: unknown, fallbackMessage: string): DomainError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 502;
    const body = error.response?.data as { message?: unknown } | undefined;
    const message = typeof body?.message === 'string' ? body.message : fallbackMessage;
    return upstreamError(status, message, body);
  }

  return upstreamError(502, fallbackMessage);
}
