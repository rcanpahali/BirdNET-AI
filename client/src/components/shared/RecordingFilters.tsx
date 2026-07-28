import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import type { DateRangeFilter } from '../../lib/dateRange';

export type { DateRangeFilter };

export interface RecordingFilterState {
  dateRange: DateRangeFilter;
  species: string[];
}

interface RecordingFiltersProps {
  filters: RecordingFilterState;
  onChange: (next: RecordingFilterState) => void;
  availableSpecies: string[];
}

export function RecordingFilters({ filters, onChange, availableSpecies }: RecordingFiltersProps) {
  const { t } = useTranslation();
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
          <SelectItem value="all">{t('common.dateRangeAll')}</SelectItem>
          <SelectItem value="7d">{t('common.dateRange7d')}</SelectItem>
          <SelectItem value="30d">{t('common.dateRange30d')}</SelectItem>
          <SelectItem value="90d">{t('common.dateRange90d')}</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter /> {t('common.species')} {filters.species.length > 0 && `(${filters.species.length})`}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64">
          {availableSpecies.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('common.noSpeciesDetectedYet')}</p>
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
              {t('common.clearSpecies')}
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
