import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { RecordingsPage } from './pages/RecordingsPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Skeleton } from './components/ui/skeleton';

// Leaflet + clustering are a meaningful bundle addition that only the Map
// view needs -- code-split so the (more common) Dashboard view stays lean.
const MapPage = lazy(() => import('./pages/MapPage'));

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="recordings" element={<RecordingsPage />} />
        <Route
          path="map"
          element={
            <Suspense fallback={<Skeleton className="h-[70vh] w-full" />}>
              <MapPage />
            </Suspense>
          }
        />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
