import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import { PlaceholderBadge } from './PlaceholderBadge';
import { cn } from '../../lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  hint?: string;
  loading?: boolean;
  /** True when the value shown is sample data, not derived from real analyses yet. */
  isPlaceholder?: boolean;
  accent?: 'primary' | 'sky' | 'success' | 'warning';
}

const accentClasses: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  sky: 'bg-sky/10 text-sky',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ icon: Icon, label, value, hint, loading, isPlaceholder, accent = 'primary' }: StatCardProps) {
  const { t } = useTranslation();
  return (
    <Card className={cn(isPlaceholder && 'border-dashed')}>
      <CardContent className="flex items-start justify-between gap-2 p-3">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            {isPlaceholder && <PlaceholderBadge label={t('common.sample')} />}
          </div>
          {loading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <p className="text-lg font-semibold tracking-tight text-foreground">{value}</p>
          )}
          {hint && !loading && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', accentClasses[accent])}>
          <Icon className="size-4" />
        </div>
      </CardContent>
    </Card>
  );
}
