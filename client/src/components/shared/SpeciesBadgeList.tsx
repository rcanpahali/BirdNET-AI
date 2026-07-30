import { useTranslation } from 'react-i18next';
import type { SpeciesCount } from '../../lib/analytics';
import { Badge } from '../ui/badge';

interface SpeciesBadgeListProps {
  species: SpeciesCount[];
  emptyLabel: string;
  /** Collapses anything beyond this into a "+N" badge -- keeps compact contexts (e.g. the map tooltip) from growing unbounded. Omit to show every species. */
  limit?: number;
  /** Appends "· N detections" to each badge. Off for tight spaces (e.g. the map tooltip),
   * where the extra text is what pushes badges onto their own line instead of wrapping neatly. */
  showCount?: boolean;
  /** Shrinks badge padding/text -- for the map tooltip, where the default size crowds a
   * popover that's already sharing space with the recording name, date, and location. */
  size?: 'default' | 'sm';
}

export function SpeciesBadgeList({ species, emptyLabel, limit, showCount = true, size = 'default' }: SpeciesBadgeListProps) {
  const { t } = useTranslation();

  if (species.length === 0) {
    return <p className="text-muted-foreground">{emptyLabel}</p>;
  }

  const shown = limit ? species.slice(0, limit) : species;
  const hiddenCount = species.length - shown.length;
  const sizeClassName = size === 'sm' ? 'gap-0.5 px-1.5 py-0 text-[10px]' : undefined;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((s) => (
        <Badge key={s.commonName} variant="success" className={sizeClassName}>
          <span>{s.commonName}</span>
          {showCount && <span className="opacity-70">· {t('recordings.detail.speciesBadgeCount', { count: s.count })}</span>}
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="muted" className={sizeClassName}>
          +{hiddenCount}
        </Badge>
      )}
    </div>
  );
}
