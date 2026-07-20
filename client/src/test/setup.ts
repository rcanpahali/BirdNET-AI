import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom has no real getUserMedia/MediaRecorder/Worker support, and this library
// creates a Worker as a module-load side effect -- mock it so importing
// Recorder.tsx doesn't crash. Recording itself isn't exercised by these tests.
vi.mock('extendable-media-recorder', () => ({
  MediaRecorder: vi.fn(),
  register: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('extendable-media-recorder-wav-encoder', () => ({
  connect: vi.fn().mockResolvedValue({}),
}));
