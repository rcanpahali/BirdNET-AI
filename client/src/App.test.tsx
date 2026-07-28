import type { ReactNode } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as apiClient from './api/client';
import { renderWithProviders } from './test/renderWithProviders';
import { LANGUAGE_STORAGE_KEY } from './i18n';

vi.mock('./api/client', async () => {
  const actual = await vi.importActual<typeof import('./api/client')>('./api/client');
  const { OTHER_TEST_PROJECT, TEST_PROJECT } = await import('./test/fixtures');
  return {
    ...actual,
    analyzeAudio: vi.fn(),
    fetchAnalyses: vi.fn(),
    fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT, OTHER_TEST_PROJECT]),
  };
});

// The lazy-loaded Interactive Map route pulls in real Leaflet, which needs
// real browser layout jsdom doesn't provide -- mock it here too (mirroring
// MapPage.test.tsx) purely so the shell-level lazy-loading/routing itself
// can be exercised without a real map render.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: ReactNode }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: { children: ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Tooltip: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children: ReactNode }) => <div data-testid="cluster">{children}</div>,
}));

describe('App', () => {
  beforeEach(() => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([]);
  });

  it('shows the Dashboard at the root route', async () => {
    renderWithProviders(<App />);
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('navigates between Dashboard, Recordings, Interactive Map, Statistics, and Projects via the sidebar', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByRole('heading', { name: /dashboard/i });
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await user.click(within(nav).getByRole('link', { name: /^recordings$/i }));
    expect(await screen.findByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: /interactive map/i }));
    expect(await screen.findByRole('heading', { name: /interactive map/i })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: /^statistics$/i }));
    expect(await screen.findByRole('heading', { name: /^statistics$/i })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: /^projects$/i }));
    expect(await screen.findByRole('heading', { name: /^projects$/i })).toBeInTheDocument();

    await user.click(within(nav).getByRole('link', { name: /^dashboard$/i }));
    expect(await screen.findByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
  });

  it('clicking "New recording" on the Dashboard navigates to Recordings and opens the dialog there', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByRole('heading', { name: /dashboard/i });
    const main = screen.getByRole('main');
    await user.click(within(main).getByRole('button', { name: /new recording/i }));

    // The dialog opens on top of the Recordings page -- its own heading is
    // correctly hidden from the accessibility tree while the modal is open.
    expect(await screen.findByRole('heading', { name: /^new recording$/i })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(await screen.findByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();
  });

  it("clicking the sidebar's Recordings link just navigates, without opening the dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByRole('heading', { name: /dashboard/i });
    const nav = screen.getByRole('navigation', { name: /primary/i });

    await user.click(within(nav).getByRole('link', { name: /^recordings$/i }));

    expect(await screen.findByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^new recording$/i })).not.toBeInTheDocument();
  });

  it('switches projects from the top nav project selector', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByRole('heading', { name: /dashboard/i });
    await user.click(screen.getByRole('button', { name: /bad vilbel wetlands/i }));
    await user.click(await screen.findByText(/alpine meadow survey/i));

    const main = screen.getByRole('main');
    expect(await within(main).findByText('Alpine Meadow Survey')).toBeInTheDocument();
  });

  it('defaults to English when no language preference is stored', async () => {
    renderWithProviders(<App />);
    expect(await screen.findByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('switches the whole app to German via the sidebar language dropdown, and persists the choice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await screen.findByRole('heading', { name: /dashboard/i });
    const nav = screen.getByRole('navigation', { name: /primary/i });
    expect(within(nav).getByRole('link', { name: /^recordings$/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^language$/i }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Deutsch' }));

    expect(await screen.findByRole('heading', { name: /^dashboard$/i })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: /^aufnahmen$/i })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: /^recordings$/i })).not.toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de');
  });
});
