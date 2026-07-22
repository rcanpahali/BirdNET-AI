import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Nav } from './components/Nav';
import { HomePage } from './pages/HomePage';
import { ListPage } from './pages/ListPage';

// Leaflet + clustering are a meaningful bundle addition that only the Map
// view needs -- code-split so the (more common) Home view stays lean.
const MapPage = lazy(() => import('./pages/MapPage'));

function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/list" element={<ListPage />} />
        <Route
          path="/map"
          element={
            <Suspense fallback={<p className="p-8 text-center text-slate-500">Loading map…</p>}>
              <MapPage />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
