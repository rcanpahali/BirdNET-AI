import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { PlaceholderBadge } from '../shared/PlaceholderBadge';
import { useProjectContext } from '../../context/ProjectContext';
import { DEFAULT_PROJECT_ID } from '../../lib/mockData';
import type { DateRangeFilter } from '../../lib/dateRange';

export type { DateRangeFilter };

export interface MapFilterState {
  dateRange: DateRangeFilter;
  species: string[];
  projectId: string;
}

interface MapFiltersProps {
  filters: MapFilterState;
  onChange: (next: MapFilterState) => void;
  availableSpecies: string[];
}

export function MapFilters({ filters, onChange, availableSpecies }: MapFiltersProps) {
  const { projects } = useProjectContext();

  const toggleSpecies = (name: string) => {
    const next = filters.species.includes(name) ? filters.species.filter((s) => s !== name) : [...filters.species, name];
    onChange({ ...filters, species: next });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={filters.dateRange} onValueChange={(value) => onChange({ ...filters, dateRange: value as DateRangeFilter })}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All time</SelectItem>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 90 days</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.projectId} onValueChange={(value) => onChange({ ...filters, projectId: value })}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter /> Species {filters.species.length > 0 && `(${filters.species.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          {availableSpecies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No species detected yet.</p>
          ) : (
            <div className="max-h-64 space-y-1 overflow-y-auto">
              {availableSpecies.map((name) => (
                <label key={name} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm hover:bg-muted">
                  <Checkbox checked={filters.species.includes(name)} onCheckedChange={() => toggleSpecies(name)} />
                  {name}
                </label>
              ))}
            </div>
          )}
          {filters.species.length > 0 && (
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => onChange({ ...filters, species: [] })}>
              Clear species
            </Button>
          )}
        </PopoverContent>
      </Popover>

      {filters.projectId !== DEFAULT_PROJECT_ID && (
        <PlaceholderBadge
          label="0 results expected"
          note="Recordings aren't scoped to a project server-side yet, so sample projects always show zero results here."
        />
      )}
    </div>
  );
}
