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

interface NewProjectDialogProps {
  trigger: ReactNode;
}

export function NewProjectDialog({ trigger }: NewProjectDialogProps) {
  const { addProject } = useProjectContext();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetLocation, setTargetLocation] = useState('');
  const nameId = useId();
  const descriptionId = useId();
  const locationId = useId();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;

    addProject({
      id: `sample-${name.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now() % 100000}`,
      name: name.trim(),
      description: description.trim() || 'No description provided.',
      targetLocation: targetLocation.trim() || 'Not set',
    });

    setName('');
    setDescription('');
    setTargetLocation('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create project</DialogTitle>
          <DialogDescription>
            Projects are stored locally in this browser tab only for now -- there is no project table in the
            database yet, so this list resets on reload and recordings can&apos;t actually be scoped to it.
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
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
