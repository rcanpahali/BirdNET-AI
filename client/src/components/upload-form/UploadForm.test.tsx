import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as geolocation from '../../lib/geolocation';
import { UploadForm } from './UploadForm';

vi.mock('../../lib/geolocation', () => ({
  requestCurrentPosition: vi.fn(),
}));

describe('UploadForm', () => {
  beforeEach(() => {
    vi.mocked(geolocation.requestCurrentPosition).mockReset().mockResolvedValue(null);
  });

  it('disables submit until a file is selected, then calls onSubmit with the form values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UploadForm loading={false} onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: /analyze audio/i })).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /^upload$/i }));

    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    const fileInput = screen.getByLabelText(/audio file/i);
    await user.upload(fileInput, file);

    expect(screen.getByText('clip.wav')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /analyze audio/i });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ file, lat: '', lon: '', minConf: '0.25' })
    );
  });

  it('disables the toggle and submit buttons while loading', () => {
    render(<UploadForm loading onSubmit={vi.fn()} />);

    expect(screen.getByRole('radio', { name: /^record$/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
  });

  it('auto-fills lat/lon from the device location when a file is selected', async () => {
    vi.mocked(geolocation.requestCurrentPosition).mockResolvedValue({ lat: 50.18, lon: 8.74 });

    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UploadForm loading={false} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('radio', { name: /^upload$/i }));

    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);

    await waitFor(() => expect(screen.getByText('50.1800, 8.7400')).toBeInTheDocument());

    // Values are tracked even while the coordinate inputs are collapsed --
    // expand via "Edit" to confirm they were actually populated.
    await user.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByLabelText(/latitude/i)).toHaveValue(50.18);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(8.74);

    await user.click(screen.getByRole('button', { name: /analyze audio/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ lat: '50.18', lon: '8.74' }));
  });

  it('does not override manually entered coordinates with the detected location', async () => {
    vi.mocked(geolocation.requestCurrentPosition).mockResolvedValue({ lat: 50.18, lon: 8.74 });

    const user = userEvent.setup();
    render(<UploadForm loading={false} onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /set manually/i }));
    await user.type(screen.getByLabelText(/latitude/i), '10');
    await user.type(screen.getByLabelText(/longitude/i), '20');

    await user.click(screen.getByRole('radio', { name: /^upload$/i }));
    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);

    expect(geolocation.requestCurrentPosition).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/latitude/i)).toHaveValue(10);
    expect(screen.getByLabelText(/longitude/i)).toHaveValue(20);
  });

  it('leaves location empty without error when it is unavailable or denied', async () => {
    vi.mocked(geolocation.requestCurrentPosition).mockResolvedValue(null);

    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<UploadForm loading={false} onSubmit={onSubmit} />);

    await user.click(screen.getByRole('radio', { name: /^upload$/i }));
    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    await user.upload(screen.getByLabelText(/audio file/i), file);

    await waitFor(() => expect(geolocation.requestCurrentPosition).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/no location set/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /analyze audio/i }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ lat: '', lon: '' }));
  });
});
