import type { ReactNode } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import * as geolocation from '../lib/geolocation';
import { RecordingsPage } from './RecordingsPage';
import { ContextPanelSlot } from '../components/layout/ContextPanelSlot';
import { renderWithProviders } from '../test/renderWithProviders';
import { buildAnalysis } from '../test/fixtures';

// Real Leaflet needs real browser layout (getBoundingClientRect, etc.) that jsdom
// doesn't provide -- the detail panel's own recording-location mini-map needs the
// same mock as MapPage.test.tsx whenever a located recording's panel is opened.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: ReactNode }) => <div data-testid="popup">{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  useMap: () => ({
    fitBounds: vi.fn(),
    flyTo: vi.fn(),
    getContainer: () => document.createElement('div'),
    invalidateSize: vi.fn(),
  }),
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="cluster">{children}</div>,
}));

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  const { TEST_PROJECT } = await import('../test/fixtures');
  return {
    ...actual,
    fetchAnalyses: vi.fn(),
    fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT]),
    analyzeAudio: vi.fn(),
    deleteAnalysis: vi.fn(),
  };
});

vi.mock('../lib/geolocation', () => ({
  requestCurrentPosition: vi.fn(),
}));

const analyses = [
  buildAnalysis({
    id: 1,
    filename: 'robin.wav',
    lat: 50.18,
    lon: 8.74,
    detectionCount: 1,
    detections: [
      { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
    ],
  }),
  buildAnalysis({ id: 2, filename: 'silence.wav', createdAt: '2026-07-20 11:00:00' }),
];

function renderRecordingsPage() {
  return renderWithProviders(
    <>
      <RecordingsPage />
      <ContextPanelSlot />
    </>
  );
}

describe('RecordingsPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.fetchAnalyses).mockReset();
    vi.mocked(apiClient.analyzeAudio).mockReset();
    vi.mocked(apiClient.deleteAnalysis).mockReset();
    vi.mocked(geolocation.requestCurrentPosition).mockReset().mockResolvedValue(null);
  });

  it('shows an empty state when there are no recordings', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([]);
    renderRecordingsPage();

    expect(await screen.findByText(/no recordings available/i)).toBeInTheDocument();
  });

  it('lists recordings in a table by default and switches to card view', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue(analyses);
    const user = userEvent.setup();
    renderRecordingsPage();

    expect(await screen.findByRole('cell', { name: 'Recording #1' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /species/i })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /card view/i }));

    expect(screen.getByRole('heading', { name: 'Recording #1' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /species/i })).not.toBeInTheDocument();
  });

  it('opens the recording detail panel when a row is selected', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue(analyses);
    const user = userEvent.setup();
    renderRecordingsPage();

    const row = await screen.findByRole('cell', { name: 'Recording #1' });
    await user.click(row);

    expect(await screen.findByRole('heading', { name: 'Recording #1' })).toBeInTheDocument();
    expect(screen.getByText('50.18000, 8.74000')).toBeInTheDocument();
  });

  it('focuses and opens the detail panel for the new recording once the dialog closes', async () => {
    const existing = buildAnalysis({ id: 1, filename: 'silence.wav', createdAt: '2026-07-20 10:00:00' });
    const created = buildAnalysis({
      id: 2,
      filename: 'clip.wav',
      createdAt: '2026-07-21 09:00:00',
      detectionCount: 1,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
      ],
    });

    vi.mocked(apiClient.fetchAnalyses).mockResolvedValueOnce([existing]).mockResolvedValue([created, existing]);
    vi.mocked(apiClient.analyzeAudio).mockResolvedValue({
      filename: 'clip.wav',
      detection_count: 1,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
      ],
      id: 2,
    });

    const user = userEvent.setup();
    renderRecordingsPage();

    expect(await screen.findByRole('cell', { name: 'Recording #1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recording/i }));
    await user.click(screen.getByRole('radio', { name: /^upload$/i }));
    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);
    await user.click(screen.getByRole('button', { name: /analyze audio/i }));

    const dialog = await screen.findByRole('dialog', { name: /analysis results/i });
    expect(within(dialog).getByText('Robin')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /done/i }));

    expect(await screen.findByRole('heading', { name: 'Recording #2' })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /Recording #2/ })).toHaveAttribute('data-state', 'selected');
  });

  it('closes the detail panel when the just-analyzed recording is deleted from the results dialog', async () => {
    const existing = buildAnalysis({ id: 1, filename: 'silence.wav', createdAt: '2026-07-20 10:00:00' });
    const created = buildAnalysis({ id: 2, filename: 'clip.wav', createdAt: '2026-07-21 09:00:00', detectionCount: 0 });

    vi.mocked(apiClient.fetchAnalyses).mockResolvedValueOnce([existing]).mockResolvedValue([created, existing]);
    vi.mocked(apiClient.analyzeAudio).mockResolvedValue({ filename: 'clip.wav', detection_count: 0, detections: [], id: 2 });
    vi.mocked(apiClient.deleteAnalysis).mockResolvedValue(undefined);

    const user = userEvent.setup();
    renderRecordingsPage();

    expect(await screen.findByRole('cell', { name: 'Recording #1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recording/i }));
    await user.click(screen.getByRole('radio', { name: /^upload$/i }));
    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);
    await user.click(screen.getByRole('button', { name: /analyze audio/i }));

    // The detail panel auto-opens behind the modal (Radix marks background content
    // aria-hidden while a Dialog is open), which also blanks its computed accessible
    // name -- so it's checked by text/selector here, not an accessible-name role query.
    const dialog = await screen.findByRole('dialog', { name: /analysis results/i });
    expect(await screen.findByText('Recording #2', { selector: 'h2' })).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(apiClient.deleteAnalysis).toHaveBeenCalledWith(2));
    expect(screen.queryByText('Recording #2', { selector: 'h2' })).not.toBeInTheDocument();
  });

  it('deletes a recording from the table row via its delete action', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValueOnce(analyses).mockResolvedValue([analyses[0]]);
    vi.mocked(apiClient.deleteAnalysis).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRecordingsPage();

    await screen.findByRole('cell', { name: 'Recording #1' });
    await user.click(screen.getByRole('button', { name: /delete recording #2/i }));
    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete recording$/i }));

    await waitFor(() => expect(apiClient.deleteAnalysis).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByRole('cell', { name: 'Recording #2' })).not.toBeInTheDocument());
  });

  it('deletes a recording from the card grid via its delete action', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValueOnce(analyses).mockResolvedValue([analyses[0]]);
    vi.mocked(apiClient.deleteAnalysis).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRecordingsPage();

    await screen.findByRole('cell', { name: 'Recording #1' });
    await user.click(screen.getByRole('radio', { name: /card view/i }));

    await user.click(screen.getByRole('button', { name: /delete recording #2/i }));
    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete recording$/i }));

    await waitFor(() => expect(apiClient.deleteAnalysis).toHaveBeenCalledWith(2));
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Recording #2' })).not.toBeInTheDocument());
  });

  it('deletes the open recording from the detail panel header and closes the panel', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValueOnce(analyses).mockResolvedValue([analyses[1]]);
    vi.mocked(apiClient.deleteAnalysis).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRecordingsPage();

    const row = await screen.findByRole('cell', { name: 'Recording #1' });
    await user.click(row);
    const heading = await screen.findByRole('heading', { name: 'Recording #1' });

    // Scoped to the panel's header row -- the table behind it renders its own,
    // identically-labeled delete button for the same recording.
    const headerRow = heading.parentElement?.parentElement as HTMLElement;
    await user.click(within(headerRow).getByRole('button', { name: /delete/i }));

    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^delete recording$/i }));

    await waitFor(() => expect(apiClient.deleteAnalysis).toHaveBeenCalledWith(1));
    expect(screen.queryByRole('heading', { name: 'Recording #1' })).not.toBeInTheDocument();
  });

  it('sorts the table by a clicked column and toggles direction on a second click', async () => {
    const short = buildAnalysis({ id: 1, filename: 'short.wav', duration: 5, createdAt: '2026-07-20 10:00:00' });
    const long = buildAnalysis({ id: 2, filename: 'long.wav', duration: 50, createdAt: '2026-07-21 10:00:00' });
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([short, long]);
    const user = userEvent.setup();
    renderRecordingsPage();

    await screen.findByRole('cell', { name: 'Recording #1' });
    // Default sort is by date, descending -- the more recent recording (#2) leads.
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Recording #2');

    await user.click(screen.getByRole('button', { name: /^duration/i }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Recording #1');

    await user.click(screen.getByRole('button', { name: /^duration/i }));
    expect(screen.getAllByRole('row')[1]).toHaveTextContent('Recording #2');
  });

  it('links to the map centered on a recording only when it has a location', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue(analyses);
    renderRecordingsPage();

    await screen.findByRole('cell', { name: 'Recording #1' });
    const links = screen.getAllByRole('link', { name: 'Map' });
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', '/map?focus=1');
  });

  it('paginates the table once there are more recordings than fit on one page', async () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      buildAnalysis({ id: i + 1, filename: `clip-${i + 1}.wav`, createdAt: `2026-07-${String(i + 1).padStart(2, '0')} 10:00:00` })
    );
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue(many);
    const user = userEvent.setup();
    renderRecordingsPage();

    await screen.findByText('Page 1 of 2');
    expect(screen.getAllByRole('row')).toHaveLength(1 + 15);

    await user.click(screen.getByRole('button', { name: /next page/i }));
    await screen.findByText('Page 2 of 2');
    expect(screen.getAllByRole('row')).toHaveLength(1 + 5);
  });
});
