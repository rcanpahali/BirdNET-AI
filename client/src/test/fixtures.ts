import type { Analysis, Project } from '@birdnet/types';

export const TEST_PROJECT: Project = {
  id: 1,
  name: 'Bad Vilbel Wetlands',
  description: 'Riparian bird monitoring along the Nidda river corridor.',
  targetLocation: 'Bad Vilbel, Hesse, Germany',
  createdAt: '2026-07-01 00:00:00',
  recordingCount: 0,
};

export const OTHER_TEST_PROJECT: Project = {
  id: 2,
  name: 'Alpine Meadow Survey',
  description: 'Sample survey project.',
  targetLocation: 'Berchtesgaden National Park, Germany',
  createdAt: '2026-07-02 00:00:00',
  recordingCount: 0,
};

export function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    id: 1,
    projectId: TEST_PROJECT.id,
    filename: 'robin.wav',
    mimetype: 'audio/wav',
    fileSize: 1000,
    lat: null,
    lon: null,
    city: null,
    minConf: 0.25,
    status: 'completed',
    errorMessage: null,
    duration: 12,
    tags: [],
    notes: null,
    createdAt: '2026-07-20 10:00:00',
    detectionCount: 0,
    detections: [],
    ...overrides,
  };
}
