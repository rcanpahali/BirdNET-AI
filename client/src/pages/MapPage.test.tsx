import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Analysis } from '@birdnet/types';
import * as apiClient from '../api/client';
import { MapPage } from './MapPage';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return { ...actual, fetchAnalyses: vi.fn() };
});

// Real Leaflet needs real browser layout (getBoundingClientRect, etc.) that jsdom
// doesn't provide -- mock the map primitives and assert on what MapPage passes them.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ position, children }: { position: [number, number]; children: ReactNode }) => (
    <div data-testid="marker" data-position={position.join(',')}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: ReactNode }) => <div data-testid="popup">{children}</div>,
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="cluster">{children}</div>,
}));

function renderMapPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MapPage />
    </QueryClientProvider>
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
    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(await screen.findByText(/1 recording with a known location/i)).toBeInTheDocument();
  });

  it('shows an empty-state message when nothing has a location yet', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withoutLocation]);

    renderMapPage();

    expect(await screen.findByText(/no recordings with location data yet/i)).toBeInTheDocument();
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });
});
