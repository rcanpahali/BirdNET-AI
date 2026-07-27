import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ProjectsPage } from './ProjectsPage';
import { renderWithProviders } from '../test/renderWithProviders';

describe('ProjectsPage', () => {
  it('shows the real project as active and sample projects as switchable', () => {
    renderWithProviders(<ProjectsPage />);

    expect(screen.getByRole('heading', { name: 'Bad Vilbel Wetlands' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /currently active/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /switch to project/i }).length).toBeGreaterThan(0);
  });

  it('creates a new (local-only) project and switches to it', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    await user.click(screen.getByRole('button', { name: /new project/i }));
    await user.type(screen.getByLabelText(/project name/i), 'Marsh Survey');
    await user.click(screen.getByRole('button', { name: /^create project$/i }));

    const marshCard = await screen.findByRole('group', { name: 'Marsh Survey' });
    expect(within(marshCard).getByRole('button', { name: /currently active/i })).toBeInTheDocument();
  });

  it('edits a project in place', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    const card = screen.getByRole('group', { name: 'Bad Vilbel Wetlands' });
    await user.click(within(card).getByRole('button', { name: /edit bad vilbel wetlands/i }));

    const nameInput = screen.getByLabelText(/project name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Bad Vilbel Wetlands Reserve');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByRole('heading', { name: 'Bad Vilbel Wetlands Reserve' })).toBeInTheDocument();
  });
});
