import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bird, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { SidebarNav } from './Sidebar';

export function MobileNav() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 lg:hidden" aria-label={t('sidebar.openMenu')}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex w-60 flex-col gap-0 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="h-14 shrink-0 flex-row items-center justify-center gap-2 border-b border-sidebar-border px-4 py-0">
          <Bird className="size-4 text-sidebar-foreground" />
          {/* i18n-exempt: app brand name, not translated */}
          <SheetTitle className="text-sm font-bold uppercase tracking-[0.2em] text-sidebar-foreground">Singwarte</SheetTitle>
        </SheetHeader>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
