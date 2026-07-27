import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Analysis } from '@birdnet/types';
import * as apiClient from '../api/client';
import { MapPage } from './MapPage';
import { ContextPanelSlot } from '../components/layout/ContextPanelSlot';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return { ...actual, fetchAnalyses: vi.fn() };
});

// Real Leaflet needs real browser layout (getBoundingClientRect, etc.) that jsdom
// doesn't provide -- mock the map primitives and assert on what MapPage passes them.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({
    position,
    children,
    eventHandlers,
  }: {
    position: [number, number];
    children: ReactNode;
    eventHandlers?: { click?: () => void };
  }) => (
    <button
      type="button"
      data-testid="marker"
      data-position={position.join(',')}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </button>
  ),
  Popup: ({ children }: { children: ReactNode }) => <div data-testid="popup">{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="cluster">{children}</div>,
}));

function renderMapPage() {
  // MapPage only opens the context panel -- render the slot alongside it (as
  // AppShell would) so its content is actually observable in the test.
  return renderWithProviders(
    <>
      <MapPage />
      <ContextPanelSlot />
    </>
  );
}

const withLocation: Analysis = {
  id: 1,
  filename: 'robin.wav',
  mimetype: 'audio/wav',
  fileSize: 1000,
  lat: 50.18,
  lon: 8.74,
  minConf: 0.25,
  createdAt: '2026-07-20 10:00:00',
  detectionCount: 1,
  detections: [
    { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
  ],
};

const withoutLocation: Analysis = {
  id: 2,
  filename: 'unknown.wav',
  mimetype: 'audio/wav',
  fileSize: 500,
  lat: null,
  lon: null,
  minConf: null,
  createdAt: '2026-07-20 11:00:00',
  detectionCount: 0,
  detections: [],
};

describe('MapPage', () => {
  beforeEach(() => {
    vi.mocked(apiClient.fetchAnalyses).mockReset();
  });

  it('only renders markers for analyses that have a location', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withLocation, withoutLocation]);

    renderMapPage();

    const markers = await screen.findAllByTestId('marker');
    expect(markers).toHaveLength(1);
    expect(markers[0]).toHaveAttribute('data-position', '50.18,8.74');
    expect(await screen.findByText(/1 of 1 located recording/i)).toBeInTheDocument();
  });

  it('shows an empty-state message when nothing has a location yet', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withoutLocation]);

    renderMapPage();

    expect(await screen.findByText(/select a map location to begin/i)).toBeInTheDocument();
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('opens the context panel with recording details when a marker is clicked', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withLocation]);
    const user = userEvent.setup();

    renderMapPage();

    const marker = await screen.findByTestId('marker');
    await user.click(marker);

    expect(await screen.findByRole('heading', { name: 'robin.wav' })).toBeInTheDocument();
    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(screen.getByText('50.18000, 8.74000')).toBeInTheDocument();
  });
});
