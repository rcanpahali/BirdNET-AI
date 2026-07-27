import { Link } from 'react-router-dom';
import { Bell, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
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
import { MOCK_NOTIFICATIONS, MOCK_USER } from '../../lib/mockData';

export function TopNav() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-card px-4">
      <Link to="/" className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
        <span aria-hidden="true" className="text-base">
          🐦
        </span>
        <span className="hidden sm:inline">BirdNET Field Station</span>
      </Link>

      <div className="h-6 w-px bg-border" />

      <ProjectSelector />

      <div className="ml-auto flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {MOCK_NOTIFICATIONS.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {MOCK_NOTIFICATIONS.length === 0 ? (
              <EmptyState
                icon={Bell}
                title="No notifications yet"
                description="This feature is not wired up to a backend yet -- there's nothing to push notifications from."
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

        <Button variant="ghost" size="icon" aria-label="Settings" asChild>
          <Link to="/settings">
            <Settings className="size-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-7">
                <AvatarFallback>{MOCK_USER.initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium text-foreground md:inline">{MOCK_USER.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{MOCK_USER.name}</span>
              <span className="text-xs font-normal text-muted-foreground">{MOCK_USER.role}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Sign out (no auth yet)</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
