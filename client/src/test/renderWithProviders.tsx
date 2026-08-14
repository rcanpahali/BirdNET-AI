import type { ReactElement } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '../components/ui/tooltip';
import { ProjectProvider } from '../context/ProjectContext';
import { ContextPanelProvider } from '../context/ContextPanelContext';
import { NewRecordingDialogProvider } from '../context/NewRecordingDialogContext';

interface ExtraOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

/** Every page relies on these providers (query cache, tooltips, project + context-panel state, router). */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: ExtraOptions = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ProjectProvider>
          <ContextPanelProvider>
            <NewRecordingDialogProvider>
              <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
            </NewRecordingDialogProvider>
          </ContextPanelProvider>
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>,
    options
  );
}
