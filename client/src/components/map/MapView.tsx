import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { Analysis } from '@birdnet/types';
import { HeatmapLayer } from './HeatmapLayer';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';

// Recording-location pins are small filled dots rather than the default Leaflet
// teardrop -- with clustering on, dozens of these can sit close together, and a
// plain dot reads better at a glance than a stack of pointed markers. The
// selected pin swaps to the sky accent, grows, and gets a pulsing ring instead
// of dimming its neighbors, so selection stays visible without any marker ever
// becoming transparent.
function buildPinIcon(selected: boolean) {
  const boxSize = selected ? 44 : 29;
  const dotSize = selected ? 26 : 18;
  const ring = selected
    ? '<span class="absolute inset-0 animate-ping rounded-full bg-sky/50"></span>'
    : '';

  return L.divIcon({
    html: `
      <span class="relative flex items-center justify-center" style="width:${boxSize}px;height:${boxSize}px">
        ${ring}
        <span class="relative rounded-full border-2 border-card shadow-md ${selected ? 'bg-sky' : 'bg-primary'}" style="width:${dotSize}px;height:${dotSize}px"></span>
      </span>
    `,
    className: 'birdnet-pin-icon',
    iconSize: [boxSize, boxSize],
    iconAnchor: [boxSize / 2, boxSize / 2],
  });
}

const PIN_ICON = buildPinIcon(false);
const PIN_ICON_SELECTED = buildPinIcon(true);

// Cluster size communicates count through the same palette used for status
// elsewhere in the app -- small groups stay in the primary green, medium
// groups shift to the sky accent, and large groups escalate to warning amber,
// rather than leaflet.markercluster's default rgba yellow/orange blobs.
function buildClusterIcon(cluster: { getChildCount(): number }) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  const colorClasses =
    count < 10 ? 'bg-primary text-primary-foreground' : count < 50 ? 'bg-sky text-sky-foreground' : 'bg-warning text-warning-foreground';

  return L.divIcon({
    html: `<div class="flex items-center justify-center rounded-full border-2 border-card font-semibold shadow-md ${colorClasses}" style="width:${size}px;height:${size}px">${count}</div>`,
    className: 'birdnet-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export type LocatedAnalysis = Analysis & { lat: number; lon: number };

const DEFAULT_CENTER: [number, number] = [50.1109, 8.6821]; // Frankfurt am Main, Germany
const DEFAULT_ZOOM = 11;

type BaseLayerKey = 'satellite' | 'terrain';

// Labels are translated in the component (via BASE_LAYER_LABEL_KEYS below) --
// url/attribution stay here since tile attribution is a legal notice, never translated.
const BASE_LAYERS: Record<BaseLayerKey, { url: string; attribution: string }> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    // i18n-exempt: legally-required tile attribution, never translated
    attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    // i18n-exempt: legally-required tile attribution, never translated
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap',
  },
};

const BASE_LAYER_LABEL_KEYS: Record<BaseLayerKey, 'map.satelliteLabel' | 'map.terrainLabel'> = {
  satellite: 'map.satelliteLabel',
  terrain: 'map.terrainLabel',
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

// Leaflet measures and caches its container size once at init and only re-checks
// on window resize -- it has no idea when a surrounding flex/panel layout (e.g.
// the resizable dashboard/context-panel split in AppShell) changes the
// container's size without the window itself resizing. Without this, a map that
// mounts while its panel is still animating/settling to its final width is left
// showing gray tiles outside its stale, too-small viewport.
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

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
  const { t } = useTranslation();
  // Compact previews (e.g. the dashboard) have no chrome to switch layers, so
  // they default to terrain -- easier to read at a glance than satellite imagery.
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>(compact ? 'terrain' : 'satellite');
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
        // Compact previews are narrower than the full map page, so fitting the same
        // marker bounds into less width would otherwise zoom out further than the
        // full page does -- a floor keeps the preview reading as "close" as it should.
        minZoom={compact ? 10 : undefined}
        scrollWheelZoom={!compact}
        zoomControl={!compact}
        dragging={!compact}
        doubleClickZoom={!compact}
        attributionControl={!compact}
        className="h-full w-full"
      >
        <TileLayer key={baseLayer} attribution={BASE_LAYERS[baseLayer].attribution} url={BASE_LAYERS[baseLayer].url} />
        <MapResizeHandler />
        <FitToMarkers analyses={analyses} />
        {showHeatmap && <HeatmapLayer points={heatPoints} />}
        {showMarkers && (
          <MarkerClusterGroup
            chunkedLoading
            disableClusteringAtZoom={compact ? undefined : 16}
            showCoverageOnHover={false}
            iconCreateFunction={buildClusterIcon}
          >
            {analyses.map((analysis) => {
              const selected = selectedId === analysis.id;
              return (
                <Marker
                  key={analysis.id}
                  position={[analysis.lat, analysis.lon]}
                  icon={selected ? PIN_ICON_SELECTED : PIN_ICON}
                  zIndexOffset={selected ? 1000 : 0}
                  eventHandlers={onMarkerClick ? { click: () => onMarkerClick(analysis) } : undefined}
                >
                  {!compact && (
                    <Tooltip direction="top" offset={[0, -34]}>
                      <span className="font-medium">{t('recordings.label', { id: analysis.id })}</span>
                      {analysis.city && (
                        <>
                          <br />
                          {analysis.city}
                        </>
                      )}
                      <br />
                      {t('map.detectionCount', { count: analysis.detectionCount })}
                    </Tooltip>
                  )}
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {!compact && (
        <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
          <div className="rounded-lg border border-border bg-card/95 p-1 shadow-md">
            <ToggleGroup type="single" value={baseLayer} onValueChange={(value) => value && setBaseLayer(value as BaseLayerKey)}>
              {Object.keys(BASE_LAYERS).map((key) => (
                <ToggleGroupItem key={key} value={key} size="sm" className="px-2.5 text-xs">
                  {t(BASE_LAYER_LABEL_KEYS[key as BaseLayerKey])}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          <div className="space-y-2 rounded-lg border border-border bg-card/95 p-2.5 text-xs shadow-md">
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={showMarkers} onCheckedChange={(checked) => setShowMarkers(Boolean(checked))} />
              {t('map.markersLabel')}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-foreground">
              <Checkbox checked={showHeatmap} onCheckedChange={(checked) => setShowHeatmap(Boolean(checked))} />
              {t('map.heatmapLabel')}
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
