import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { TooltipProvider } from './components/ui/tooltip';
import { ProjectProvider } from './context/ProjectContext';
import { ContextPanelProvider } from './context/ContextPanelContext';
import { NewRecordingDialogProvider } from './context/NewRecordingDialogContext';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <ProjectProvider>
          <ContextPanelProvider>
            <NewRecordingDialogProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </NewRecordingDialogProvider>
          </ContextPanelProvider>
        </ProjectProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </StrictMode>
);
