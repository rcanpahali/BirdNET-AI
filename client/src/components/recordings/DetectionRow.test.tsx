import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Detection } from '@birdnet/types';
import { DetectionRow } from './DetectionRow';

const detection: Detection = {
  common_name: 'Eurasian Blackbird',
  scientific_name: 'Turdus merula',
  confidence: 0.874,
  start_time: 3,
  end_time: 6,
};

describe('DetectionRow', () => {
  it('renders the card variant with a formatted confidence badge', () => {
    render(<DetectionRow detection={detection} />);

    expect(screen.getByText('Eurasian Blackbird')).toBeInTheDocument();
    expect(screen.getByText('Turdus merula')).toBeInTheDocument();
    expect(screen.getByText('87.4%')).toBeInTheDocument();
    expect(screen.getByText(/3\.0s - 6\.0s/)).toBeInTheDocument();
  });

  it('renders the compact variant inside a list item', () => {
    render(
      <ul>
        <DetectionRow detection={detection} variant="compact" />
      </ul>
    );

    expect(screen.getByRole('listitem')).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 87\.4%/)).toBeInTheDocument();
  });
});
