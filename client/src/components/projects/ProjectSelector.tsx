import { Check, ChevronsUpDown, FolderKanban, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { NewProjectDialog } from './NewProjectDialog';
import { useProjectContext } from '../../context/ProjectContext';

export function ProjectSelector() {
  const { projects, selectedProject, selectProject } = useProjectContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-56 justify-between font-normal">
          <span className="flex min-w-0 items-center gap-2">
            <FolderKanban className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{selectedProject.name}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Switch project</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)} className="items-start">
            <Check className={project.id === selectedProject.id ? 'mt-0.5 opacity-100' : 'mt-0.5 opacity-0'} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1.5 truncate font-medium text-foreground">
                {project.name}
                {project.isSample && (
                  <Badge variant="placeholder" className="px-1.5 py-0 text-[10px]">
                    Sample
                  </Badge>
                )}
              </span>
              <span className="truncate text-xs text-muted-foreground">{project.targetLocation}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <NewProjectDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus /> New project
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
