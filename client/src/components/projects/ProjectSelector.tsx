import { useTranslation } from 'react-i18next';
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
import { NewProjectDialog } from './NewProjectDialog';
import { useProjectContext } from '../../context/ProjectContext';

export function ProjectSelector() {
  const { t } = useTranslation();
  const { projects, selectedProject, selectProject } = useProjectContext();
  if (!selectedProject) return null;

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
        <DropdownMenuLabel>{t('projects.selector.switchProject')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {projects.map((project) => (
          <DropdownMenuItem key={project.id} onSelect={() => selectProject(project.id)} className="items-start">
            <Check className={project.id === selectedProject.id ? 'mt-0.5 opacity-100' : 'mt-0.5 opacity-0'} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium text-foreground">{project.name}</span>
              <span className="truncate text-xs text-muted-foreground">{project.targetLocation || t('common.noLocationSet')}</span>
            </span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <NewProjectDialog
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Plus /> {t('projects.new')}
            </DropdownMenuItem>
          }
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
