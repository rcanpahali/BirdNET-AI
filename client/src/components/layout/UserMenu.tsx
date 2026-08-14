import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings } from 'lucide-react';
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
import { cn } from '../../lib/utils';
import { MOCK_USER } from '../../lib/mockData';

interface UserMenuProps {
  triggerClassName?: string;
  align?: 'start' | 'end';
  /** Always show the guest name text, instead of collapsing to the avatar below the `md` breakpoint. */
  alwaysShowName?: boolean;
}

export function UserMenu({ triggerClassName, align = 'end', alwaysShowName = false }: UserMenuProps) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn('gap-2 px-2', triggerClassName)}>
          <Avatar className="size-7">
            <AvatarFallback>{MOCK_USER.initials}</AvatarFallback>
          </Avatar>
          <span className={cn('truncate text-sm font-medium text-foreground', !alwaysShowName && 'hidden md:inline')}>
            {t('topNav.guestName')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="font-medium text-foreground">{t('topNav.guestName')}</span>
          <span className="text-xs font-normal text-muted-foreground">{t('topNav.guestRole')}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/settings">
            <Settings /> {t('nav.settings')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled>{t('topNav.signOut')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
