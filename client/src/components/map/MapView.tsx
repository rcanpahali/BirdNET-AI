import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Analysis } from '@birdnet/types';
import { HeatmapLayer } from './HeatmapLayer';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';

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

export type LocatedAnalysis = Analysis & { lat: number; lon: number };

const DEFAULT_CENTER: [number, number] = [50.1109, 8.6821]; // Frankfurt am Main, Germany
const DEFAULT_ZOOM = 11;

type BaseLayerKey = 'street' | 'satellite' | 'terrain';

const BASE_LAYERS: Record<BaseLayerKey, { label: string; url: string; attribution: string }> = {
  street: {
    label: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    label: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
  terrain: {
    label: 'Terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
  },
};

function FitToMarkers({ analyses }: { analyses: LocatedAnalysis[] }) {
  const map = useMap();

  useEffect(() => {
    if (analyses.length === 0) return;
    const bounds = L.latLngBounds(analyses.map((a) => [a.lat, a.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 });
  }, [map, analyses]);

  return null;
}

interface MapViewProps {
  analyses: LocatedAnalysis[];
  /** Compact mode disables interaction chrome for small dashboard previews. */
  compact?: boolean;
  onMarkerClick?: (analysis: LocatedAnalysis) => void;
  selectedId?: number | null;
  className?: string;
}

export function MapView({ analyses, compact = false, onMarkerClick, selectedId, className }: MapViewProps) {
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>('street');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showMarkers, setShowMarkers] = useState(true);

  const heatPoints = useMemo<Array<[number, number, number]>>(
    () => analyses.map((a) => [a.lat, a.lon, Math.min(1, 0.35 + a.detectionCount * 0.15)]),
    [analyses]
  );

  return (
    <div className={cn('relative isolate h-full w-full overflow-hidden rounded-[inherit]', className)}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={!compact}
        zoomControl={!compact}
        dragging={!compact}
        doubleClickZoom={!compact}
        attributionControl={!compact}
        className="h-full w-full"
      >
        <TileLayer key={baseLayer} attribution={BASE_LAYERS[baseLayer].attribution} url={BASE_LAYERS[baseLayer].url} />
        <FitToMarkers analyses={analyses} />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {showMarkers && (
          <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={compact ? undefined : 16}>
            {analyses.map((analysis) => (
              <Marker
                key={analysis.id}
                position={[analysis.lat, analysis.lon]}
                opacity={selectedId && selectedId !== analysis.id ? 0.55 : 1}
                eventHandlers={onMarkerClick ? { click: () => onMarkerClick(analysis) } : undefined}
              >
                {!compact && (
                  <Tooltip direction="top" offset={[0, -34]}>
                    <span className="font-medium">{analysis.filename}</span>
                    <br />
                    {analysis.detectionCount} detection{analysis.detectionCount !== 1 ? 's' : ''}
                  </Tooltip>
                )}
              </Marker>
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {!compact && (
        <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
          <div className="rounded-lg border border-border bg-card/95 p-1 shadow-md">
            <ToggleGroup type="single" value={baseLayer} onValueChange={(value) => value && setBaseLayer(value as BaseLayerKey)}>
              {Object.entries(BASE_LAYERS).map(([key, cfg]) => (
                <ToggleGroupItem key={key} value={key} size="sm" className="px-2.5 text-xs">
                  {cfg.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-card/95 p-2.5 text-xs shadow-md">
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={showMarkers} onCheckedChange={(checked) => setShowMarkers(Boolean(checked))} />
              Markers
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={showHeatmap} onCheckedChange={(checked) => setShowHeatmap(Boolean(checked))} />
              Heatmap
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
