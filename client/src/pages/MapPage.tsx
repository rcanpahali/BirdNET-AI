import { useMemo } from 'react';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Analysis } from '@birdnet/types';
import { DetectionRow } from '../components/DetectionRow';
import { useAnalyses } from '../hooks/useAnalyses';

// Leaflet's default marker icon paths break under bundlers -- point them at the bundled assets.
const defaultIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type LocatedAnalysis = Analysis & { lat: number; lon: number };

const DEFAULT_CENTER: [number, number] = [50.1109, 8.6821]; // Frankfurt am Main, Germany
const DEFAULT_ZOOM = 11;

export function MapPage() {
  const { data: analyses, isLoading } = useAnalyses();

  const located = useMemo<LocatedAnalysis[]>(
    () => (analyses ?? []).filter((analysis): analysis is LocatedAnalysis => analysis.lat !== null && analysis.lon !== null),
    [analyses]
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Recordings Map</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLoading
              ? 'Loading...'
              : located.length === 0
                ? 'No recordings with location data yet.'
                : `${located.length} recording${located.length !== 1 ? 's' : ''} with a known location`}
          </p>
        </div>

        <div className="h-[70vh] w-full">
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MarkerClusterGroup chunkedLoading>
              {located.map((analysis) => (
                <Marker key={analysis.id} position={[analysis.lat, analysis.lon]}>
                  <Popup>
                    <div className="min-w-[200px]">
                      <p className="mb-1 font-semibold">{analysis.filename}</p>
                      <p className="mb-2 text-xs text-gray-500">{new Date(analysis.createdAt).toLocaleString()}</p>
                      {analysis.detections.length === 0 ? (
                        <p className="text-sm text-gray-500">No detections</p>
                      ) : (
                        <ul className="max-h-40 list-none overflow-y-auto">
                          {analysis.detections.map((detection, index) => (
                            <DetectionRow key={index} detection={detection} variant="compact" />
                          ))}
                        </ul>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export default MapPage;
