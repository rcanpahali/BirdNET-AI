import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { createApp as CreateApp } from '../src/app';

let fakeUpstream: Server;
let app: ReturnType<typeof CreateApp>;

const upstreamAnalyzeResponse = {
  filename: 'clip.wav',
  detections: [
    {
      common_name: 'Test Bird',
      scientific_name: 'Testus birdus',
      confidence: 0.91,
      start_time: 0,
      end_time: 3,
    },
  ],
  detection_count: 1,
  analysis_time_seconds: 0.42,
};

beforeAll(async () => {
  fakeUpstream = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url?.startsWith('/health')) {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'healthy', analyzer_ready: true }));
      return;
    }
    if (req.url?.startsWith('/analyze')) {
      res.writeHead(200);
      res.end(JSON.stringify(upstreamAnalyzeResponse));
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  await new Promise<void>((resolve) => fakeUpstream.listen(0, resolve));
  const { port } = fakeUpstream.address() as AddressInfo;
  process.env.BIRDNET_API_URL = `http://127.0.0.1:${port}`;
  process.env.MAX_FILE_SIZE = '1000';

  const { createApp } = await import('../src/app');
  app = createApp();
});

afterAll(() => {
  fakeUpstream.close();
});

describe('GET /health', () => {
  it('proxies the upstream health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'healthy', analyzer_ready: true });
  });
});

describe('POST /analyze', () => {
  it('rejects when no file is uploaded', async () => {
    const response = await request(app).post('/analyze');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  it('rejects unsupported file extensions', async () => {
    const response = await request(app).post('/analyze').attach('file', Buffer.from('not audio'), 'clip.txt');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  it('rejects an out-of-range min_conf', async () => {
    const response = await request(app)
      .post('/analyze')
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('min_conf', '5');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
  });

  it('rejects a file over the configured size limit', async () => {
    const response = await request(app)
      .post('/analyze')
      .attach('file', Buffer.alloc(2000, 'a'), 'clip.wav');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_error');
    expect(response.body.message).toMatch(/too large/i);
  });

  it('proxies a valid upload to the analyzer and persists the result', async () => {
    const response = await request(app)
      .post('/analyze')
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('lat', '35.4')
      .field('min_conf', '0.4');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(upstreamAnalyzeResponse);
  });
});

describe('GET /analyses', () => {
  it('returns the persisted analysis with its detections nested in a single query', async () => {
    const response = await request(app).get('/analyses');

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    const [analysis] = response.body;
    expect(analysis.filename).toBe('clip.wav');
    expect(analysis.detectionCount).toBe(analysis.detections.length);
    expect(analysis.detections[0].common_name).toBe('Test Bird');
  });
});

describe('unknown routes', () => {
  it('returns a structured 404', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'not_found', message: 'Not found' });
  });
});
