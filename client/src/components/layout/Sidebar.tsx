import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AudioLines, BarChart3, FolderKanban, LayoutDashboard, Map, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';
import { LanguageToggle } from './LanguageToggle';
import { UserMenu } from './UserMenu';
import { NewRecordingCard } from './NewRecordingCard';

type NavLabelKey = 'nav.dashboard' | 'nav.recordings' | 'nav.map' | 'nav.statistics' | 'nav.projects' | 'nav.settings';

interface NavItem {
  to: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard, end: true },
  { to: '/recordings', labelKey: 'nav.recordings', icon: AudioLines },
  { to: '/map', labelKey: 'nav.map', icon: Map },
  { to: '/statistics', labelKey: 'nav.statistics', icon: BarChart3 },
  { to: '/projects', labelKey: 'nav.projects', icon: FolderKanban },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
];

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useTranslation();
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
    </NavLink>
  );
}

/** Nav content shared between the desktop `Sidebar` and the mobile `MobileNav` sheet. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="px-3 pt-3">
        <NewRecordingCard onNavigate={onNavigate} />
      </div>

      <nav aria-label={t('nav.primary')} className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.to} item={item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="px-3 py-3">
        <Separator className="mb-3 bg-sidebar-border" />
        <div className="space-y-3">
          <UserMenu triggerClassName="w-full justify-start" align="start" alwaysShowName />
          <LanguageToggle variant="dropdown" />
          <a
            href="https://birdnet.cornell.edu/analyzer/"
            target="_blank"
            rel="noopener noreferrer"
            className="block px-1 text-[10px] leading-snug text-sidebar-foreground/60 hover:text-sidebar-foreground hover:underline"
          >
            {t('sidebar.poweredBy')}
          </a>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <SidebarNav />
    </aside>
  );
}
