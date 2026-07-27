import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Analysis } from '@birdnet/types';
import * as apiClient from '../api/client';
import { RecordingsPage } from './RecordingsPage';
import { ContextPanelSlot } from '../components/layout/ContextPanelSlot';
import { renderWithProviders } from '../test/renderWithProviders';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return { ...actual, fetchAnalyses: vi.fn() };
});

const analyses: Analysis[] = [
  {
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
  },
  {
    id: 2,
    filename: 'silence.wav',
    mimetype: 'audio/wav',
    fileSize: 500,
    lat: null,
    lon: null,
    minConf: null,
    createdAt: '2026-07-20 11:00:00',
    detectionCount: 0,
    detections: [],
  },
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

    expect(await screen.findByRole('cell', { name: 'robin.wav' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /species/i })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /card view/i }));

    expect(screen.getByRole('heading', { name: 'robin.wav' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /species/i })).not.toBeInTheDocument();
  });

  it('opens the recording detail panel when a row is selected', async () => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue(analyses);
    const user = userEvent.setup();
    renderRecordingsPage();

    const row = await screen.findByRole('cell', { name: 'robin.wav' });
    await user.click(row);

    expect(await screen.findByRole('heading', { name: 'robin.wav' })).toBeInTheDocument();
    expect(screen.getByText(/gps coordinates/i)).toBeInTheDocument();
  });
});
