import { useId, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useProjectContext } from '../../context/ProjectContext';
import type { MockProject } from '../../lib/mockData';

interface EditProjectDialogProps {
  project: MockProject;
  trigger: ReactNode;
}

export function EditProjectDialog({ project, trigger }: EditProjectDialogProps) {
  const { updateProject } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [targetLocation, setTargetLocation] = useState(project.targetLocation);
  const nameId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setName(project.name);
      setDescription(project.description);
      setTargetLocation(project.targetLocation);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      targetLocation: targetLocation.trim() || 'Not set',
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
          <DialogDescription>
            Projects are stored locally in this browser tab only for now -- there is no project table in the
            database yet, so these changes reset on reload.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Project name</Label>
            <Input id={nameId} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Riverbank Survey 2026" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={locationId}>Target location</Label>
            <Input
              id={locationId}
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="e.g. Taunus foothills, Germany"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={descriptionId}>Description</Label>
            <Input
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short summary of this project's goals"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
