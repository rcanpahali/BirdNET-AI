import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { i18n } from '../i18n';

// Every page mounts inside ProjectProvider, which fetches projects on mount --
// default to a single real project so tests that don't care about project
// data (and don't declare their own `vi.mock('../api/client', ...)`) still
// resolve past the "create your first project" gate in AppShell. Imported
// dynamically inside the factory (not as a top-level binding) since `vi.mock`
// factories are hoisted above regular imports.
vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  const { TEST_PROJECT } = await import('./fixtures');
  return {
    ...actual,
    fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT]),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  };
});

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

// A test that switches to German (see LanguageToggle tests) mutates the
// shared i18next singleton -- reset it so that choice can't leak into
// unrelated tests asserting the default English copy.
afterEach(() => {
  void i18n.changeLanguage('en');
});

