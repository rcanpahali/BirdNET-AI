import type { ReactNode } from 'react';
import { screen, within } from '@testing-library/react';
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
  Tooltip: ({ children, permanent }: { children: ReactNode; permanent?: boolean }) => (
    <div data-testid="tooltip" data-permanent={permanent ? 'true' : 'false'}>
      {children}
    </div>
  ),
  // Also stands in for MapResizeHandler's `useMap()` call, which needs
  // `getContainer`/`invalidateSize` alongside FitToMarkers' `fitBounds`.
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

function renderMapPage(route = '/map') {
  // MapPage only opens the context panel -- render the slot alongside it (as
  // AppShell would) so its content is actually observable in the test.
  return renderWithProviders(
    <>
      <MapPage />
      <ContextPanelSlot />
    </>,
    { route }
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
    // The marker's own tooltip now also shows "Robin" (species badge), so the detail
    // panel's copy has to be scoped to disambiguate the two.
    const panel = screen.getByTestId('context-panel-content');
    expect(within(panel).getByText('Robin')).toBeInTheDocument();
    expect(within(panel).getByText('50.18000, 8.74000')).toBeInTheDocument();
  });

  it('auto-opens the detail panel for a recording linked in via ?focus=', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withLocation, withoutLocation]);

    renderMapPage('/map?focus=1');

    expect(await screen.findByRole('heading', { name: 'Recording #1' })).toBeInTheDocument();
  });

  it('shows recording, location and species in the marker tooltip (without detection counts), and keeps it permanently visible once selected', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([withLocation]);
    const user = userEvent.setup();

    renderMapPage();

    const tooltip = await screen.findByTestId('tooltip');
    // The recording label and its short date sit in adjacent text nodes (label, then
    // ", <date>" in a nested span) -- assert on the tooltip's combined text rather than
    // a single element, and leave the date's exact formatting unasserted (locale-dependent).
    expect(tooltip.textContent).toContain('Recording #1, ');
    expect(within(tooltip).getByText('50.180, 8.740')).toBeInTheDocument();
    expect(within(tooltip).getByText('Robin')).toBeInTheDocument();
    expect(within(tooltip).queryByText(/detection/i)).not.toBeInTheDocument();
    expect(tooltip).toHaveAttribute('data-permanent', 'false');

    await user.click(screen.getByTestId('marker'));

    expect(await screen.findByTestId('tooltip')).toHaveAttribute('data-permanent', 'true');
  });
});
