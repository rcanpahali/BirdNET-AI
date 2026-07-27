import { useState } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as apiClient from '../../api/client';
import * as geolocation from '../../lib/geolocation';
import { NewRecordingDialog } from './NewRecordingDialog';
import { renderWithProviders } from '../../test/renderWithProviders';

vi.mock('../../api/client', async () => {
  const actual = await vi.importActual<typeof import('../../api/client')>('../../api/client');
  return { ...actual, analyzeAudio: vi.fn() };
});

vi.mock('../../lib/geolocation', () => ({
  requestCurrentPosition: vi.fn(),
}));

// NewRecordingDialog has no trigger of its own -- it's driven externally
// (normally by NewRecordingButton + NewRecordingDialogContext). This harness
// stands in for that: it opens by default and exposes a "Reopen" button so
// tests can exercise close -> reopen without needing a real trigger.
function ControlledDialog() {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Reopen
      </button>
      <NewRecordingDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

async function uploadAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^upload$/i }));
  const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
  await user.upload(screen.getByLabelText(/audio file/i), file);
  await user.click(screen.getByRole('button', { name: /analyze audio/i }));
}

describe('NewRecordingDialog', () => {
  beforeEach(() => {
    vi.mocked(geolocation.requestCurrentPosition).mockReset().mockResolvedValue(null);
    vi.mocked(apiClient.analyzeAudio).mockReset();
  });

  it('uploads a file and shows the analysis results', async () => {
    vi.mocked(apiClient.analyzeAudio).mockResolvedValue({
      filename: 'clip.wav',
      detection_count: 1,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
      ],
    });

    const user = userEvent.setup();
    renderWithProviders(<ControlledDialog />);

    await uploadAndSubmit(user);

    expect(await screen.findByText('Robin')).toBeInTheDocument();
    expect(apiClient.analyzeAudio).toHaveBeenCalledTimes(1);
  });

  it('shows an error with a retry option, and succeeds after retrying', async () => {
    vi.mocked(apiClient.analyzeAudio)
      .mockRejectedValueOnce(new Error('Analysis request to the BirdNET service failed'))
      .mockResolvedValueOnce({ filename: 'clip.wav', detection_count: 0, detections: [] });

    const user = userEvent.setup();
    renderWithProviders(<ControlledDialog />);

    await uploadAndSubmit(user);

    await waitFor(() =>
      expect(screen.getByText(/analysis request to the birdnet service failed/i)).toBeInTheDocument()
    );

    await user.click(screen.getByRole('button', { name: /retry/i }));

    expect(await screen.findByText(/no bird sounds detected/i)).toBeInTheDocument();
    expect(apiClient.analyzeAudio).toHaveBeenCalledTimes(2);
  });

  it('resets to the upload form when reopened after a completed analysis', async () => {
    vi.mocked(apiClient.analyzeAudio).mockResolvedValue({ filename: 'clip.wav', detection_count: 0, detections: [] });

    const user = userEvent.setup();
    renderWithProviders(<ControlledDialog />);

    await uploadAndSubmit(user);
    expect(await screen.findByText(/no bird sounds detected/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /done/i }));
    await user.click(screen.getByRole('button', { name: /^reopen$/i }));

    expect(screen.getByRole('button', { name: /analyze audio/i })).toBeDisabled();
  });
});
