import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '@birdnet/types';
import type { ProjectInput } from '../api/client';
import { ProjectsPage } from './ProjectsPage';
import { renderWithProviders } from '../test/renderWithProviders';
import { TEST_PROJECT } from '../test/fixtures';

const { projectsStore } = vi.hoisted(() => ({ projectsStore: { list: [] as Project[] } }));

vi.mock('../api/client', async () => {
  const actual = await vi.importActual<typeof import('../api/client')>('../api/client');
  return {
    ...actual,
    fetchProjects: vi.fn(() => Promise.resolve(projectsStore.list)),
    createProject: vi.fn((input: ProjectInput) => {
      const project: Project = {
        id: projectsStore.list.length + 1,
        name: input.name,
        description: input.description ?? null,
        targetLocation: input.targetLocation ?? null,
        createdAt: '2026-07-27 00:00:00',
        recordingCount: 0,
      };
      projectsStore.list = [...projectsStore.list, project];
      return Promise.resolve(project);
    }),
    updateProject: vi.fn((id: number, input: Partial<ProjectInput>) => {
      projectsStore.list = projectsStore.list.map((p) => (p.id === id ? { ...p, ...input } : p));
      return Promise.resolve(projectsStore.list.find((p) => p.id === id)!);
    }),
    deleteProject: vi.fn((id: number) => {
      projectsStore.list = projectsStore.list.filter((p) => p.id !== id);
      return Promise.resolve();
    }),
  };
});

describe('ProjectsPage', () => {
  beforeEach(() => {
    projectsStore.list = [{ ...TEST_PROJECT, recordingCount: 3 }];
  });

  it('shows the project as active with its recording count', async () => {
    renderWithProviders(<ProjectsPage />);

    expect(await screen.findByRole('heading', { name: 'Bad Vilbel Wetlands' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /currently active/i })).toBeInTheDocument();
    expect(screen.getByText('3 recordings')).toBeInTheDocument();
  });

  it('creates a new project and switches to it', async () => {
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

    const card = await screen.findByRole('group', { name: 'Bad Vilbel Wetlands' });
    await user.click(within(card).getByRole('button', { name: /edit bad vilbel wetlands/i }));

    const nameInput = screen.getByLabelText(/project name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Bad Vilbel Wetlands Reserve');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(await screen.findByRole('heading', { name: 'Bad Vilbel Wetlands Reserve' })).toBeInTheDocument();
  });

  it('warns with the real recording count before deleting, then removes it on confirm', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ProjectsPage />);

    const card = await screen.findByRole('group', { name: 'Bad Vilbel Wetlands' });
    await user.click(within(card).getByRole('button', { name: /delete bad vilbel wetlands/i }));

    expect(await screen.findByText(/permanently delete/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete project$/i }));

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Bad Vilbel Wetlands' })).not.toBeInTheDocument());
  });
});
