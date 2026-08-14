import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

interface NewRecordingDialogValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const NewRecordingDialogContext = createContext<NewRecordingDialogValue | null>(null);

/**
 * Lets the sidebar's "Recordings" link (or any other entry point) request
 * the New Recording dialog open on the Recordings page, even from a
 * different page -- set directly from a click handler, read directly by
 * the page, no effect-based synchronization needed.
 */
export function NewRecordingDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<NewRecordingDialogValue>(() => ({ open, setOpen }), [open]);
  return <NewRecordingDialogContext.Provider value={value}>{children}</NewRecordingDialogContext.Provider>;
}

export function useNewRecordingDialog(): NewRecordingDialogValue {
  const context = useContext(NewRecordingDialogContext);
  if (!context) throw new Error('useNewRecordingDialog must be used within a NewRecordingDialogProvider');
  return context;
}
