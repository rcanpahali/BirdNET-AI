import express, { Request, Response } from 'express';
import cors from 'cors';
import axios, { AxiosError } from 'axios';
import multer from 'multer';
import FormData from 'form-data';
import dotenv from 'dotenv';
import { saveAnalysisResult, getAllAnalyses } from './services/analysisService';
import { AnalyzerResponse } from './types';

dotenv.config();

const port = Number.parseInt(process.env.PORT ?? '8080', 10);
const birdnetApiUrl = process.env.BIRDNET_API_URL ?? 'http://localhost:8000';
const configuredMaxFileSize = Number.parseInt(process.env.MAX_FILE_SIZE ?? '', 10);
const maxFileSize = Number.isFinite(configuredMaxFileSize)
  ? configuredMaxFileSize
  : 100 * 1024 * 1024; // 100MB default

const app = express();
app.disable('x-powered-by');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxFileSize,
  },
});

app.use(cors());

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'BirdNet proxy API', upstream: birdnetApiUrl });
});

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const response = await axios.get(`${birdnetApiUrl}/health`, { timeout: 15000 });
    res.json(response.data);
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? (error as AxiosError) : undefined;
    const status = axiosError?.response?.status ?? 502;
    const payload = extractUpstreamPayload(axiosError?.response?.data, {
      detail: 'Failed to reach BirdNET backend',
      error: formatAxiosError(error),
    });
    res.status(status).json(payload);
  }
});

app.post('/analyze', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ detail: 'No file uploaded' });
      return;
    }

    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      knownLength: req.file.size,
    });

    const params: Record<string, string> = {};

    const { lat, lon, min_conf: minConf } = req.body as {
      lat?: string;
      lon?: string;
      min_conf?: string;
    };

    const parsedLat = parseOptionalNumber(lat);
    const parsedLon = parseOptionalNumber(lon);
    const parsedMinConf = parseOptionalNumber(minConf);

    if (typeof lat === 'string' && lat.trim().length > 0) {
      params.lat = lat.trim();
    }

    if (typeof lon === 'string' && lon.trim().length > 0) {
      params.lon = lon.trim();
    }

    if (typeof minConf === 'string' && minConf.trim().length > 0) {
      params.min_conf = minConf.trim();
    }

    const axiosResponse = await axios.post<AnalyzerResponse>(
      `${birdnetApiUrl}/analyze`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
        params,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    const payload = axiosResponse.data;

    saveAnalysisResult({
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      fileSize: req.file.size,
      lat: parsedLat,
      lon: parsedLon,
      minConf: parsedMinConf,
      detections: Array.isArray(payload?.detections) ? payload.detections : [],
    });

    res.json(payload);
  } catch (error: unknown) {
    const axiosError = axios.isAxiosError(error) ? (error as AxiosError) : undefined;
    const status = axiosError?.response?.status ?? 502;
    const payload = extractUpstreamPayload(axiosError?.response?.data, {
      detail: 'Analysis failed',
      error: formatAxiosError(error),
    });
    res.status(status).json(payload);
  }
});

app.get('/analyses', (_req: Request, res: Response) => {
  try {
    const analyses = getAllAnalyses();
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch analyses', error: String(error) });
  }
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ detail: 'Not found' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express proxy listening on port ${port} -> ${birdnetApiUrl}`);
});

function formatAxiosError(error: unknown): string {
  const axiosError = axios.isAxiosError(error) ? (error as AxiosError) : undefined;

  if (axiosError) {
    if (axiosError.response) {
      return `Upstream ${axiosError.response.status}: ${JSON.stringify(axiosError.response.data)}`;
    }
    if (axiosError.request) {
      return 'No response received from upstream service';
    }
    return axiosError.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown error';
}

function extractUpstreamPayload(
  data: unknown,
  fallback: Record<string, unknown>
): Record<string, unknown> {
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }

  return fallback;
}

function parseOptionalNumber(value?: string): number | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}
