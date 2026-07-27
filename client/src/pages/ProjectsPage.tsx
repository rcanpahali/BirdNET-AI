import { Plus } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/button';
import { NewProjectDialog } from '../components/projects/NewProjectDialog';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectDetailPanel } from '../components/projects/ProjectDetailPanel';
import { useProjectContext } from '../context/ProjectContext';
import { useContextPanel } from '../context/ContextPanelContext';

export function ProjectsPage() {
  const { projects, selectedProject, selectProject } = useProjectContext();
  const { open } = useContextPanel();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Navigate between projects to compare recordings, locations, and analytics."
        actions={
          <NewProjectDialog
            trigger={
              <Button>
                <Plus /> New project
              </Button>
            }
          />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            active={project.id === selectedProject.id}
            onSelect={() => selectProject(project.id)}
            onViewDetails={() =>
              open({ title: project.name, description: project.targetLocation, content: <ProjectDetailPanel project={project} /> })
            }
          />
        ))}
      </div>
    </div>
  );
}

export default ProjectsPage;
