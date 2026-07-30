import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface ContextPanelState {
  title: string;
  description?: string;
  content: ReactNode;
  /** Extra icon button(s) rendered in the header next to the close button (e.g. delete). */
  headerAction?: ReactNode;
}

interface ContextPanelValue {
  panel: ContextPanelState | null;
  open: (panel: ContextPanelState) => void;
  close: () => void;
}

const ContextPanelContext = createContext<ContextPanelValue | null>(null);

export function ContextPanelProvider({ children }: { children: ReactNode }) {
  const [panel, setPanel] = useState<ContextPanelState | null>(null);

  const value = useMemo<ContextPanelValue>(
    () => ({
      panel,
      open: (next) => setPanel(next),
      close: () => setPanel(null),
    }),
    [panel]
  );

  return <ContextPanelContext.Provider value={value}>{children}</ContextPanelContext.Provider>;
}

export function useContextPanel(): ContextPanelValue {
  const context = useContext(ContextPanelContext);
  if (!context) throw new Error('useContextPanel must be used within a ContextPanelProvider');
  return context;
}
