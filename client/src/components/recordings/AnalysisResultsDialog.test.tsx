import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AnalyzerResponse } from '@birdnet/types';
import * as apiClient from '../../api/client';
import { AnalysisResultsDialog } from './AnalysisResultsDialog';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../api/client')>('../../api/client');
  const { TEST_PROJECT } = await import('../../test/fixtures');
  return { ...actual, deleteAnalysis: vi.fn(), fetchProjects: vi.fn().mockResolvedValue([TEST_PROJECT]) };
});

describe('AnalysisResultsDialog', () => {
  beforeEach(() => {
    vi.mocked(apiClient.deleteAnalysis).mockReset().mockResolvedValue(undefined);
  });

  it('shows the title and a found-count description', () => {
    const results: AnalyzerResponse = {
      filename: 'clip.wav',
      detection_count: 2,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.9, start_time: 0, end_time: 3 },
        { common_name: 'Wren', scientific_name: 'Troglodytes troglodytes', confidence: 0.6, start_time: 3, end_time: 6 },
      ],
      id: 7,
    };

    renderWithProviders(<AnalysisResultsDialog open results={results} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /analysis results/i })).toBeInTheDocument();
    expect(screen.getByText(/found/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('clip.wav')).toBeInTheDocument();
  });

  it('shows a plain Done button when species were detected', () => {
    const results: AnalyzerResponse = {
      filename: 'clip.wav',
      detection_count: 1,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.9, start_time: 0, end_time: 3 },
      ],
      id: 7,
    };

    renderWithProviders(<AnalysisResultsDialog open results={results} onOpenChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /^done$/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^keep$/i })).not.toBeInTheDocument();
  });

  it('deletes the analysis and closes when Delete is confirmed for a zero-detection result', async () => {
    const results: AnalyzerResponse = { filename: 'clip.wav', detection_count: 0, detections: [], id: 42 };
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AnalysisResultsDialog open results={results} onOpenChange={onOpenChange} />);

    expect(screen.queryByRole('button', { name: /^done$/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => expect(apiClient.deleteAnalysis).toHaveBeenCalledWith(42));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('closes without deleting when Keep is clicked for a zero-detection result', async () => {
    const results: AnalyzerResponse = { filename: 'clip.wav', detection_count: 0, detections: [], id: 42 };
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<AnalysisResultsDialog open results={results} onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: /^keep$/i }));

    expect(apiClient.deleteAnalysis).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
