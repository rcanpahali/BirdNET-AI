import { Routes, Route } from 'react-router-dom';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NewRecordingButton } from './NewRecordingButton';
import { useNewRecordingDialog } from '../../context/NewRecordingDialogContext';
import { renderWithProviders } from '../../test/renderWithProviders';

function DialogOpenIndicator() {
  const { open } = useNewRecordingDialog();
  return <p>Dialog is {open ? 'open' : 'closed'}</p>;
}

function TestApp() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <h1>Dashboard</h1>
            <NewRecordingButton />
            <DialogOpenIndicator />
          </>
        }
      />
      <Route
        path="/recordings"
        element={
          <>
            <h1>Recordings</h1>
            <NewRecordingButton />
            <DialogOpenIndicator />
          </>
        }
      />
    </Routes>
  );
}

describe('NewRecordingButton', () => {
  it('navigates to Recordings and requests the dialog open when clicked from another page', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, { route: '/' });

    expect(screen.getByText(/dialog is closed/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recording/i }));

    expect(await screen.findByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();
    expect(screen.getByText(/dialog is open/i)).toBeInTheDocument();
  });

  it('just requests the dialog open, without navigating, when already on Recordings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestApp />, { route: '/recordings' });

    expect(screen.getByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();
    expect(screen.getByText(/dialog is closed/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /new recording/i }));

    expect(screen.getByRole('heading', { name: /^recordings$/i })).toBeInTheDocument();
    expect(screen.getByText(/dialog is open/i)).toBeInTheDocument();
  });
});
