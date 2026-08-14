import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useContextPanel } from '../../context/ContextPanelContext';

export function ContextPanelSlot() {
  const { t } = useTranslation();
  const { panel, close } = useContextPanel();
  if (!panel) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{panel.title}</h2>
          {panel.description && <p className="truncate text-xs text-muted-foreground">{panel.description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {panel.headerAction}
          <Button variant="outline" size="icon" className="shrink-0" onClick={close} aria-label={t('topNav.closePanel')}>
            <X className="size-5" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4" data-testid="context-panel-content">
          {panel.content}
        </div>
      </ScrollArea>
    </div>
  );
}
