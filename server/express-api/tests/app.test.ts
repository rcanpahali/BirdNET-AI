import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { createApp as CreateApp } from '../src/app';

let fakeUpstream: Server;
let app: ReturnType<typeof CreateApp>;
let projectId: number;
const analyzeRequestUrls: string[] = [];

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
  duration_seconds: 3.5,
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
      const chunks: Buffer[] = [];
      req.on('data', (chunk: Buffer) => chunks.push(chunk));
      req.on('end', () => {
        analyzeRequestUrls.push(req.url!);
        const body = Buffer.concat(chunks).toString('utf8');
        // Test double for an upstream analysis failure -- a real corrupt file
        // isn't needed, just a filename the fake server recognizes.
        if (body.includes('broken.wav')) {
          res.writeHead(422);
          res.end(JSON.stringify({ error: 'audio_decoding_error', message: 'Unable to read audio file.' }));
          return;
        }
        res.writeHead(200);
        res.end(JSON.stringify(upstreamAnalyzeResponse));
      });
      return;
    }
    if (req.url?.startsWith('/reverse')) {
      res.writeHead(200);
      res.end(JSON.stringify({ address: { city: 'Bad Vilbel' } }));
      return;
    }
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not_found' }));
  });

  await new Promise<void>((resolve) => fakeUpstream.listen(0, resolve));
  const { port } = fakeUpstream.address() as AddressInfo;
  process.env.BIRDNET_API_URL = `http://127.0.0.1:${port}`;
  process.env.GEOCODING_API_URL = `http://127.0.0.1:${port}`;
  process.env.MAX_FILE_SIZE = '1000';

  const { createApp } = await import('../src/app');
  app = createApp();
});

afterAll(() => {
  fakeUpstream.close();
});

beforeEach(async () => {
  const response = await request(app).post('/projects').send({ name: 'Bad Vilbel Wetlands' });
  projectId = response.body.id;
});

describe('GET /health', () => {
  it('proxies the upstream health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'healthy', analyzer_ready: true });
  });
});

describe('POST /projects', () => {
  it('creates a project with a description and target location', async () => {
    const response = await request(app)
      .post('/projects')
      .send({ name: 'Alpine Meadow Survey', description: 'Sample survey', targetLocation: 'Berchtesgaden' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: 'Alpine Meadow Survey',
      description: 'Sample survey',
      targetLocation: 'Berchtesgaden',
      recordingCount: 0,
    });
  });

  it('rejects a project with no name', async () => {
    const response = await request(app).post('/projects').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
  });
});

describe('GET /projects and /projects/:id', () => {
  it('lists projects and includes the real recording count', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const list = await request(app).get('/projects');
    const project = list.body.find((p: { id: number }) => p.id === projectId);

    expect(project.recordingCount).toBe(1);

    const detail = await request(app).get(`/projects/${projectId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.recordingCount).toBe(1);
  });

  it('404s for a project that does not exist', async () => {
    const response = await request(app).get('/projects/999999');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not_found');
  });
});

describe('PATCH /projects/:id', () => {
  it('updates project fields', async () => {
    const response = await request(app).patch(`/projects/${projectId}`).send({ name: 'Bad Vilbel Wetlands Reserve' });

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Bad Vilbel Wetlands Reserve');
  });
});

describe('DELETE /projects/:id', () => {
  it('cascades to delete every analysis linked to the project', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const del = await request(app).delete(`/projects/${projectId}`);
    expect(del.status).toBe(204);

    const analyses = await request(app).get('/analyses').query({ projectId });
    expect(analyses.body).toEqual([]);
  });

  it('404s when deleting a project that does not exist', async () => {
    const response = await request(app).delete('/projects/999999');

    expect(response.status).toBe(404);
  });
});

describe('POST /analyze', () => {
  it('rejects when no file is uploaded', async () => {
    const response = await request(app).post('/analyze');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
  });

  it('rejects unsupported file extensions', async () => {
    const response = await request(app).post('/analyze').attach('file', Buffer.from('not audio'), 'clip.txt');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
  });

  it('rejects an out-of-range min_conf', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('min_conf', '5');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
  });

  it('rejects a file over the configured size limit', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.alloc(2000, 'a'), 'clip.wav');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
    expect(response.body.message).toMatch(/too large/i);
  });

  it('rejects when project_id refers to a project that does not exist', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', '999999')
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('not_found');
  });

  it('proxies a valid upload to the analyzer and persists the result', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('lat', '35.4')
      .field('min_conf', '0.4');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(upstreamAnalyzeResponse);
  });

  it('persists the real analysis duration reported by the analyzer', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const list = await request(app).get('/analyses').query({ projectId });
    expect(list.body[0].duration).toBe(3.5);
  });

  it('persists a failed analysis (without detections) when the upstream analyzer errors', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'broken.wav');

    expect(response.status).toBe(422);
    expect(response.body.error).toBe('upstream');

    const list = await request(app).get('/analyses').query({ projectId });
    const failed = list.body.find((a: { filename: string }) => a.filename === 'broken.wav');

    expect(failed).toMatchObject({ status: 'failed', detectionCount: 0, duration: null });
    expect(failed.errorMessage).toMatch(/unable to read audio file/i);
  });
});

describe('POST /analyze location handling', () => {
  it('does not forward lat/lon to the upstream analyzer, even when provided', async () => {
    // BirdNET's location-based species filtering excludes anything outside the
    // recording's region, which is wrong for arbitrary uploads not recorded on-site.
    const before = analyzeRequestUrls.length;

    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('lat', '50.12')
      .field('lon', '8.69');

    const [analyzeUrl] = analyzeRequestUrls.slice(before);

    expect(analyzeUrl).not.toMatch(/lat=/);
    expect(analyzeUrl).not.toMatch(/lon=/);
  });

  it('still persists the submitted lat/lon for analysis history', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('lat', '50.12')
      .field('lon', '8.69');

    const response = await request(app).get('/analyses').query({ projectId });
    const match = response.body.find(
      (analysis: { lat: number | null }) => analysis.lat !== null && Math.abs(analysis.lat - 50.12) < 0.001
    );

    expect(match).toBeDefined();
    expect(match.lon).toBeCloseTo(8.69);
  });

  it('resolves and persists a city name from the reverse-geocoding service', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav')
      .field('lat', '50.18')
      .field('lon', '8.74');

    const response = await request(app).get('/analyses').query({ projectId });
    const match = response.body.find(
      (analysis: { lat: number | null }) => analysis.lat !== null && Math.abs(analysis.lat - 50.18) < 0.001
    );

    expect(match).toBeDefined();
    expect(match.city).toBe('Bad Vilbel');
  });

  it('leaves city null when no location was submitted', async () => {
    const response = await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    expect(response.status).toBe(200);

    const list = await request(app).get('/analyses').query({ projectId });
    expect(list.body[0].city).toBeNull();
  });
});

describe('GET /analyses', () => {
  it('requires a projectId query parameter', async () => {
    const response = await request(app).get('/analyses');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation');
  });

  it('returns the persisted analysis with its detections nested in a single query, scoped to the project', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const response = await request(app).get('/analyses').query({ projectId });

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);

    const [analysis] = response.body;
    expect(analysis.projectId).toBe(projectId);
    expect(analysis.filename).toBe('clip.wav');
    expect(analysis.detectionCount).toBe(analysis.detections.length);
    expect(analysis.detections[0].common_name).toBe('Test Bird');
  });

  it('does not return analyses that belong to a different project', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const otherProject = await request(app).post('/projects').send({ name: 'Coastal Reserve Transect' });
    const response = await request(app).get('/analyses').query({ projectId: otherProject.body.id });

    expect(response.body).toEqual([]);
  });
});

describe('PATCH /analyses/:id', () => {
  it('updates tags and notes on an existing analysis', async () => {
    await request(app)
      .post('/analyze')
      .field('project_id', String(projectId))
      .attach('file', Buffer.from('RIFF....WAVEfmt '), 'clip.wav');

    const [analysis] = (await request(app).get('/analyses').query({ projectId })).body;

    const response = await request(app)
      .patch(`/analyses/${analysis.id}`)
      .send({ tags: ['riverbank', 'dawn-chorus'], notes: 'Clear morning recording.' });

    expect(response.status).toBe(200);
    expect(response.body.tags).toEqual(['riverbank', 'dawn-chorus']);
    expect(response.body.notes).toBe('Clear morning recording.');
  });

  it('404s when the analysis does not exist', async () => {
    const response = await request(app).patch('/analyses/999999').send({ notes: 'test' });

    expect(response.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('returns a structured 404', async () => {
    const response = await request(app).get('/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'not_found', message: 'Not found' });
  });
});
