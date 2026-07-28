import type { ReactNode } from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import { MapPage } from './MapPage';
import { ContextPanelSlot } from '../components/layout/ContextPanelSlot';
import { renderWithProviders } from '../test/renderWithProviders';
import { buildAnalysis } from '../test/fixtures';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  const { TEST_PROJECT } = await import('../test/fixtures');
  return { ...actual, fetchAnalyses: vi.fn(), fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT]) };
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
  // Also stands in for MapResizeHandler's `useMap()` call, which needs
  // `getContainer`/`invalidateSize` alongside FitToMarkers' `fitBounds`.
  useMap: () => ({ fitBounds: vi.fn(), getContainer: () => document.createElement('div'), invalidateSize: vi.fn() }),
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

const withLocation = buildAnalysis({
  id: 1,
  filename: 'robin.wav',
  lat: 50.18,
  lon: 8.74,
  detectionCount: 1,
  detections: [
    { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
  ],
});

const withoutLocation = buildAnalysis({
  id: 2,
  filename: 'unknown.wav',
  createdAt: '2026-07-20 11:00:00',
});

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

    expect(await screen.findByRole('heading', { name: 'Recording #1' })).toBeInTheDocument();
    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(screen.getByText('50.18000, 8.74000')).toBeInTheDocument();
  });
});
