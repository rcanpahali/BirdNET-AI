import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ContextPanelSlot } from './ContextPanelSlot';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { useContextPanel } from '../../context/ContextPanelContext';

export function AppShell() {
  const location = useLocation();
  const { panel, close } = useContextPanel();

  // The context panel's content is tied to a selection (a recording, a
  // marker, a project) that's specific to one page -- close it on
  // navigation so it can't show stale content on a screen that doesn't
  // know what it's referring to.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close identity is stable via useMemo
  }, [location.pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel id="main" order={1} minSize={45} className="!overflow-y-auto">
            <div className="mx-auto min-h-full max-w-[1700px] px-6 py-6 lg:px-8">
              <Outlet />
            </div>
          </ResizablePanel>
          {panel && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel
                id="context"
                order={2}
                defaultSize={28}
                minSize={22}
                maxSize={42}
                className="!overflow-y-auto border-l border-border bg-card"
              >
                <ContextPanelSlot />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
