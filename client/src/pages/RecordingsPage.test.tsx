import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../api/client';
import * as geolocation from '../lib/geolocation';
import { RecordingsPage } from './RecordingsPage';
import { ContextPanelSlot } from '../components/layout/ContextPanelSlot';
import { renderWithProviders } from '../test/renderWithProviders';
import { buildAnalysis } from '../test/fixtures';

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  const { TEST_PROJECT } = await import('../test/fixtures');
  return {
    ...actual,
    fetchAnalyses: vi.fn(),
    fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT]),
    analyzeAudio: vi.fn(),
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
    });

    const user = userEvent.setup();
    renderRecordingsPage();

    expect(await screen.findByRole('cell', { name: 'Recording #1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recording/i }));
    await user.click(screen.getByRole('radio', { name: /^upload$/i }));
    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);
    await user.click(screen.getByRole('button', { name: /analyze audio/i }));

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByText('Robin')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /done/i }));

    expect(await screen.findByRole('heading', { name: 'Recording #2' })).toBeInTheDocument();
    expect(await screen.findByRole('row', { name: /Recording #2/ })).toHaveAttribute('data-state', 'selected');
  });
});
