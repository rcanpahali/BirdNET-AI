import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEFAULT_PROJECT_ID, MOCK_PROJECTS } from '../lib/mockData';
import type { MockProject } from '../lib/mockData';

interface ProjectContextValue {
  projects: MockProject[];
  selectedProject: MockProject;
  selectProject: (id: string) => void;
  /** Local-only: not persisted, no backend endpoint exists yet. */
  addProject: (project: Omit<MockProject, 'isSample'>) => void;
  /** Local-only: not persisted, no backend endpoint exists yet. */
  updateProject: (id: string, updates: Pick<MockProject, 'name' | 'description' | 'targetLocation'>) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<MockProject[]>(MOCK_PROJECTS);
  const [selectedId, setSelectedId] = useState(DEFAULT_PROJECT_ID);

  const value = useMemo<ProjectContextValue>(() => {
    const selectedProject = projects.find((p) => p.id === selectedId) ?? projects[0];
    return {
      projects,
      selectedProject,
      selectProject: setSelectedId,
      addProject: (project) => {
        setProjects((prev) => [...prev, { ...project, isSample: true }]);
        setSelectedId(project.id);
      },
      updateProject: (id, updates) => {
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      },
    };
  }, [projects, selectedId]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProjectContext(): ProjectContextValue {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProjectContext must be used within a ProjectProvider');
  return context;
}
