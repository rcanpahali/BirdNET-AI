import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ProjectSelector } from '../projects/ProjectSelector';
import { EmptyState } from '../shared/EmptyState';
import { UserMenu } from './UserMenu';
import { MOCK_NOTIFICATIONS } from '../../lib/mockData';

const CITY_NAME = import.meta.env.VITE_CITY_NAME ?? 'Bad Vilbel';
const ORG_NAME = import.meta.env.VITE_ORG_NAME ?? 'Verein für Vogelschutz und Landschaftspflege Bad Vilbel e.V.';

export function TopNav() {
  const { t } = useTranslation();

  return (
    <header className="grid h-14 shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-border bg-card px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-baseline gap-2">
          {/* i18n-exempt: app brand name, not translated */}
          <span className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Singwarte</span>
          {/* i18n-exempt: per-deployment city/org name from VITE_CITY_NAME, not translatable UI copy */}
          <span className="hidden text-xs text-muted-foreground sm:inline">{CITY_NAME}</span>
        </Link>

        <div className="h-6 w-px shrink-0 bg-border" />

        <ProjectSelector />
      </div>

      {/* i18n-exempt: the nonprofit's real legal name from VITE_ORG_NAME, never translated */}
      <p className="hidden min-w-0 truncate text-center text-xs text-muted-foreground lg:block" title={ORG_NAME}>
        {ORG_NAME}
      </p>

      <div className="flex items-center justify-end gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={t('topNav.notifications')}>
              <Bell className="size-4" />
              {MOCK_NOTIFICATIONS.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>{t('topNav.notifications')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOCK_NOTIFICATIONS.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={t('topNav.noNotificationsTitle')}
                description={t('topNav.noNotificationsDescription')}
                className="py-6"
              />
            ) : (
              MOCK_NOTIFICATIONS.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex-col items-start gap-0.5">
                  <span className="font-medium text-foreground">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.description}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" aria-label={t('nav.settings')} asChild>
          <Link to="/settings">
            <Settings className="size-4" />
          </Link>
        </Button>

        <UserMenu />
      </div>
    </header>
  );
}
