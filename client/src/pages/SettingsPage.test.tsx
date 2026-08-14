import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { LANGUAGE_STORAGE_KEY } from '../i18n';

describe('SettingsPage', () => {
  it('switches the interface language via the language toggle and persists the choice', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);

    expect(screen.getByRole('heading', { name: /^settings$/i })).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Deutsch' }));

    expect(await screen.findByRole('heading', { name: /^einstellungen$/i })).toBeInTheDocument();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('de');
  });
});
