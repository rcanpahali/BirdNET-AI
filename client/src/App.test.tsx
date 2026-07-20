import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import * as apiClient from './api/client';

vi.mock('./api/client', async () => {
  const actual = await vi.importActual<typeof import('./api/client')>('./api/client');
  return {
    ...actual,
    analyzeAudio: vi.fn(),
    fetchAnalyses: vi.fn(),
  };
});

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

async function uploadFile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /upload file/i }));
  const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
  await user.upload(screen.getByLabelText(/audio file/i), file);
}

describe('App', () => {
  beforeEach(() => {
    vi.mocked(apiClient.fetchAnalyses).mockResolvedValue([]);
  });

  it('submits an upload and renders the analysis results', async () => {
    vi.mocked(apiClient.analyzeAudio).mockResolvedValue({
      filename: 'clip.wav',
      detection_count: 1,
      detections: [
        { common_name: 'Robin', scientific_name: 'Erithacus rubecula', confidence: 0.8, start_time: 0, end_time: 3 },
      ],
    });

    const user = userEvent.setup();
    renderApp();

    await uploadFile(user);
    await user.click(screen.getByRole('button', { name: /analyze audio/i }));

    await waitFor(() => expect(screen.getByText('Robin')).toBeInTheDocument());
    expect(apiClient.analyzeAudio).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when analysis fails', async () => {
    vi.mocked(apiClient.analyzeAudio).mockRejectedValue(new Error('Analysis request to the BirdNET service failed'));

    const user = userEvent.setup();
    renderApp();

    await uploadFile(user);
    await user.click(screen.getByRole('button', { name: /analyze audio/i }));

    await waitFor(() =>
      expect(screen.getByText(/analysis request to the birdnet service failed/i)).toBeInTheDocument()
    );
  });
});
