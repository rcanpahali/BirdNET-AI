import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
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

function renderApp(initialPath = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function uploadFile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^upload$/i }));
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

  it('navigates between the Analyze, List, and Map views via the top nav', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole('heading', { name: /analyze a recording/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /^list$/i }));
    expect(await screen.findByRole('heading', { name: /analysis history/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /map/i }));
    expect(await screen.findByRole('heading', { name: /recordings map/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /analyze/i }));
    expect(await screen.findByRole('heading', { name: /analyze a recording/i })).toBeInTheDocument();
  });
});
