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

// jsdom doesn't implement ResizeObserver, which react-resizable-panels (the
// app shell's split layout) and recharts' <ResponsiveContainer> both rely on
// to measure their containers -- stub it so those components can mount.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverStub);

// jsdom doesn't implement createObjectURL/revokeObjectURL -- the upload flow
// and audio player use them to preview a File/Blob picked in this session.
if (!URL.createObjectURL) {
  URL.createObjectURL = vi.fn(() => 'blob:mock-url');
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = vi.fn();
}

