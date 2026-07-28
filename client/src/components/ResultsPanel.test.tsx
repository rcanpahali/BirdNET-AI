import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { AnalyzerResponse } from '@birdnet/types';
import { ResultsPanel } from './ResultsPanel';
import { TooltipProvider } from './ui/tooltip';

describe('ResultsPanel', () => {
  it('shows a no-detections message when the list is empty', () => {
    const results: AnalyzerResponse = { filename: 'clip.wav', detection_count: 0, detections: [] };

    render(
      <TooltipProvider>
        <ResultsPanel results={results} />
      </TooltipProvider>
    );

    expect(screen.getByText(/no bird sounds detected/i)).toBeInTheDocument();
  });

  it('renders one row per detection when detections are present', () => {
    const results: AnalyzerResponse = {
      filename: 'clip.wav',
      detection_count: 2,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.9, start_time: 0, end_time: 3 },
        { common_name: 'Wren', scientific_name: 'Troglodytes troglodytes', confidence: 0.6, start_time: 3, end_time: 6 },
      ],
    };

    render(
      <TooltipProvider>
        <ResultsPanel results={results} />
      </TooltipProvider>
    );

    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(screen.getByText('Wren')).toBeInTheDocument();
  });

  it('seeks the audio player to the detection start time when its card is clicked', async () => {
    const results: AnalyzerResponse = {
      filename: 'clip.wav',
      detection_count: 1,
      detections: [{ common_name: 'Blackbird', scientific_name: 'Turdus merula', confidence: 0.9, start_time: 4, end_time: 6 }],
    };

    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <ResultsPanel results={results} audioSource={{ url: 'blob:clip', filename: 'clip.wav' }} />
      </TooltipProvider>
    );

    expect(screen.getByText('0:00 / —:—')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /blackbird/i }));

    expect(screen.getByText('0:04 / —:—')).toBeInTheDocument();
  });
});
