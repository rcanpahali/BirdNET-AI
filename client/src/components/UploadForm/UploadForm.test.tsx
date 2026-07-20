import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UploadForm } from './UploadForm';

describe('UploadForm', () => {
  it('disables submit until a file is selected, then calls onSubmit with the form values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UploadForm loading={false} onSubmit={onSubmit} />);

    expect(screen.getByRole('button', { name: /analyze audio/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /upload file/i }));

    const file = new File(['fake audio content'], 'clip.wav', { type: 'audio/wav' });
    const fileInput = screen.getByLabelText(/audio file/i);
    await user.upload(fileInput, file);

    expect(screen.getByText('Selected: clip.wav')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /analyze audio/i });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ file, lat: '', lon: '', minConf: '0.25' })
    );
  });

  it('shows a validation error for an out-of-range confidence value', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<UploadForm loading={false} onSubmit={onSubmit} />);

    const minConfInput = screen.getByLabelText(/minimum confidence/i);
    await user.clear(minConfInput);
    await user.type(minConfInput, '5');
    await user.tab();

    expect(screen.getByText(/enter a value between 0 and 1/i)).toBeInTheDocument();
  });

  it('disables the toggle and submit buttons while loading', () => {
    render(<UploadForm loading onSubmit={vi.fn()} />);

    expect(screen.getByRole('button', { name: /record audio/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /analyzing/i })).toBeDisabled();
  });
});
