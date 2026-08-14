import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, Bird, Settings } from 'lucide-react';
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
import { MobileNav } from './MobileNav';
import { MOCK_NOTIFICATIONS } from '../../lib/mockData';

const CITY_NAME = import.meta.env.VITE_CITY_NAME ?? 'Bad Vilbel';
const ORG_NAME = import.meta.env.VITE_ORG_NAME ?? 'Verein für Vogelschutz und Landschaftspflege Bad Vilbel e.V.';
const CITY_ORG_NAME = ORG_NAME ? `${CITY_NAME} - ${ORG_NAME}` : CITY_NAME;

export function TopNav() {
  const { t } = useTranslation();

  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 lg:h-14 lg:flex-nowrap lg:py-0">
        <div className="order-1 flex shrink-0 items-center gap-4">
          <MobileNav />

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <Bird className="size-4 text-foreground" />
            {/* i18n-exempt: app brand name, not translated */}
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Singwarte</span>
          </Link>
        </div>

        {/* Full-width on mobile (wraps to its own row below); inline next to the brand from `lg` up. */}
        <div className="order-3 flex min-w-0 basis-full items-center gap-4 lg:order-2 lg:basis-auto">
          <div className="hidden h-6 w-px shrink-0 bg-border lg:block" />
          <ProjectSelector />
        </div>

        {/* i18n-exempt: per-deployment city/org name from VITE_CITY_NAME/VITE_ORG_NAME, never translated */}
        <p
          className="order-4 hidden min-w-0 flex-1 truncate text-center text-xs text-muted-foreground lg:order-3 lg:block"
          title={CITY_ORG_NAME}
        >
          {CITY_ORG_NAME}
        </p>

        <div className="order-2 ml-auto flex items-center justify-end gap-1.5 lg:order-4 lg:ml-0">
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

          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" aria-label={t('nav.settings')} asChild>
            <Link to="/settings">
              <Settings className="size-4" />
            </Link>
          </Button>

          <UserMenu />
        </div>
      </div>
    </header>
  );
}
