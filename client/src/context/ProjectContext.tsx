import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Project } from '@birdnet/types';
import { useProjects } from '../hooks/useProjects';

const SELECTED_PROJECT_STORAGE_KEY = 'birdnet.selectedProjectId';

interface ProjectContextValue {
  projects: Project[];
  isLoading: boolean;
  selectedProject: Project | null;
  selectProject: (id: number) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useProjects();
  const projects = useMemo(() => data ?? [], [data]);

  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const stored = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    return stored ? Number(stored) : null;
  });

  const selectedProject = useMemo(() => {
    const found = projects.find((project) => project.id === selectedId);
    return found ?? projects[0] ?? null;
  }, [projects, selectedId]);

  // Keep storage in sync even when the fallback (first project) is what ends
  // up selected -- e.g. after the previously-selected project was deleted.
  useEffect(() => {
    if (selectedProject) localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, String(selectedProject.id));
  }, [selectedProject]);

  const value = useMemo<ProjectContextValue>(
    () => ({
      projects,
      isLoading,
      selectedProject,
      selectProject: setSelectedId,
    }),
    [projects, isLoading, selectedProject]
  );

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
}
