import { NavLink } from 'react-router-dom';
import { AudioLines, BarChart3, FolderKanban, LayoutDashboard, Map, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Separator } from '../ui/separator';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/recordings', label: 'Recordings', icon: AudioLines },
  { to: '/map', label: 'Interactive Map', icon: Map },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
];

function NavRow({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          isActive && 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground'
        )
      }
    >
      <item.icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <nav aria-label="Primary" className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavRow key={item.to} item={item} />
        ))}
      </nav>

      <div className="px-3 py-3">
        <Separator className="mb-3 bg-sidebar-border" />
        <NavRow item={{ to: '/settings', label: 'Settings', icon: Settings }} />
      </div>
    </aside>
  );
}
