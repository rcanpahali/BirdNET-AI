import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FolderPlus } from 'lucide-react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ContextPanelSlot } from './ContextPanelSlot';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../shared/EmptyState';
import { Button } from '../ui/button';
import { NewProjectDialog } from '../projects/NewProjectDialog';
import { SupportButton } from '../shared/SupportButton';
import { useContextPanel } from '../../context/ContextPanelContext';
import { useProjectContext } from '../../context/ProjectContext';

export function AppShell() {
  const { t } = useTranslation();
  const location = useLocation();
  const { panel, close } = useContextPanel();
  const { isLoading, selectedProject } = useProjectContext();

  // The context panel's content is tied to a selection (a recording, a
  // marker, a project) that's specific to one page -- close it on
  // navigation so it can't show stale content on a screen that doesn't
  // know what it's referring to.
  useEffect(() => {
    close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- close identity is stable via useMemo
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col gap-4 p-6">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  // Recordings can't exist outside a project, so every page downstream of
  // this gate can safely assume `selectedProject` is non-null.
  if (!selectedProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon={FolderPlus}
          title={t('appShell.createFirstProjectTitle')}
          description={t('appShell.createFirstProjectDescription')}
          action={
            <NewProjectDialog
              trigger={
                <Button>
                  <FolderPlus /> {t('projects.new')}
                </Button>
              }
            />
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          <ResizablePanel id="main" order={1} minSize={45} className="!overflow-y-auto">
            {/* The map wants to fill the panel edge-to-edge (no page padding/max-width, and a
                real `h-full` rather than `min-h-full` so its own internal `flex-1` map canvas
                gets a definite height to resolve against) -- every other page keeps the
                padded, width-capped, content-height reading layout. */}
            {location.pathname === '/map' ? (
              <div role="main" className="h-full">
                <Outlet />
              </div>
            ) : (
              <div role="main" className="mx-auto min-h-full max-w-[1700px] px-6 py-6 lg:px-8">
                <Outlet />
              </div>
            )}
            <SupportButton />
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
