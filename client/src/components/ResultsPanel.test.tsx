import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AnalyzerResponse } from '@birdnet/types';
import { ResultsPanel } from './ResultsPanel';

describe('ResultsPanel', () => {
  it('shows a no-detections message when the list is empty', () => {
    const results: AnalyzerResponse = { filename: 'clip.wav', detection_count: 0, detections: [] };

    render(<ResultsPanel results={results} />);

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

    render(<ResultsPanel results={results} />);

    expect(screen.getByText('Robin')).toBeInTheDocument();
    expect(screen.getByText('Wren')).toBeInTheDocument();
    expect(screen.getByText(/Found/)).toBeInTheDocument();
    expect(screen.getByText('clip.wav')).toBeInTheDocument();
  });
});
