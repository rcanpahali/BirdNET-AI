import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { AudioLines, Flame, Mountain, Satellite } from 'lucide-react';
import type { Analysis } from '@birdnet/types';
import { HeatmapLayer } from './HeatmapLayer';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { SpeciesBadgeList } from '../shared/SpeciesBadgeList';
import { speciesDistribution } from '../../lib/analytics';
import { formatDateShort, formatLocation } from '../../lib/format';
import { cn } from '../../lib/utils';

// What a pin/cluster's number represents: raw detection volume, or how many recordings
// got grouped into this pin. Only the Dashboard's compact preview switches this to
// 'recordings' today; every other MapView caller keeps the 'detections' default.
type PinMetric = 'detections' | 'recordings';

// Carries each marker's detection count onto the underlying Leaflet instance (via the
// <Marker> ref below) so a parent cluster can add them up in buildClusterIcon --
// leaflet.markercluster only gives an icon-create-function the raw child markers, with
// no way back to the React-side analysis/detection data otherwise.
type MetricMarker = L.Marker & { birdnetDetectionCount?: number };

// Recording-location pins are small filled dots rather than the default Leaflet
// teardrop -- with clustering on, dozens of these can sit close together, and a
// plain dot reads better at a glance than a stack of pointed markers. The
// selected pin swaps to a warning-amber accent and grows, so selection stays
// visible without any marker ever becoming transparent. Amber (rather than the
// sky accent used for GPS/map chrome elsewhere, or red, which read as an
// error/alert rather than a selection) is deliberate here -- it needs to read
// as "this one" at a glance against a map full of sky-toned satellite/terrain
// tiles, without alarming. The single-recording preview (compact mode) also
// gets a pulsing ring around its one-and-only pin -- on the full interactive
// map, with many pins on screen and clicking around to compare them, the same
// animation read as distracting rather than helpful, so it's compact-only.
// Every pin -- selected or not -- carries its own total detection count (not
// unique species -- a recording with the same species called four times reads
// as "4 findings here", not "1"). In 'recordings' mode a lone, ungrouped pin gets
// `value` forced to 0 by the caller -- see the `pinValue` comment below for why.
function buildPinIcon(selected: boolean, blink: boolean, value: number) {
  const boxSize = selected ? 44 : 35;
  const dotSize = selected ? 26 : 22;
  const ring = blink ? '<span class="absolute inset-0 animate-ping rounded-full bg-warning/80"></span>' : '';
  const labelColor = selected ? 'text-warning-foreground' : 'text-primary-foreground';
  // A recording with zero for the active metric gets a bare dot, not a "0" -- the
  // number's job is to communicate how much was found here, and a zero reads as a
  // broken/empty label rather than a meaningful count.
  const label = value > 0 ? `<span class="relative text-[11px] font-semibold leading-none ${labelColor}">${value}</span>` : '';
  // The unselected/neutral pin's white ring is thinner than the selected pin's --
  // at this dot's larger new size, the same 2px border read as heavier/chunkier
  // than the subtle "just a marker" look it's going for.
  const borderClass = selected ? 'border-2' : 'border';

  return L.divIcon({
    html: `
      <span class="relative flex items-center justify-center" style="width:${boxSize}px;height:${boxSize}px">
        ${ring}
        <span class="relative flex items-center justify-center rounded-full ${borderClass} border-card shadow-md ${selected ? 'bg-warning' : 'bg-primary'}" style="width:${dotSize}px;height:${dotSize}px">${label}</span>
      </span>
    `,
    className: 'birdnet-pin-icon',
    iconSize: [boxSize, boxSize],
    iconAnchor: [boxSize / 2, boxSize / 2],
  });
}

// Cluster size communicates magnitude through size alone, not color -- a color ramp
// here would double as a second signal alongside the focused/selected marker's own
// color (warning amber), which read as confusing rather than informative. Every
// cluster uses the same neutral primary green, rather than leaflet.markercluster's
// default rgba yellow/orange blobs. In 'detections' mode the number is the sum of
// detections found across every recording folded into the cluster -- "roughly how much
// is going on around here". In 'recordings' mode it's simply how many recordings got
// merged into this pin (leaflet.markercluster's own childCount) -- a lone recording
// carries no interesting count on its own (see buildPinIcon/pinValue), but a handful of
// visits to the same spot piling up into "6" is the whole point of this metric.
function buildClusterIcon(cluster: { getChildCount(): number; getAllChildMarkers(): MetricMarker[] }, metric: PinMetric) {
  const childCount = cluster.getChildCount();
  const size = childCount < 10 ? 43 : childCount < 50 ? 53 : 62;
  const value =
    metric === 'recordings'
      ? childCount
      : cluster.getAllChildMarkers().reduce((sum, marker) => sum + (marker.birdnetDetectionCount ?? 0), 0);
  // Same bare-dot treatment as the individual pin (buildPinIcon) when there's nothing to show.
  const label = value > 0 ? value : '';

  return L.divIcon({
    html: `<div class="flex items-center justify-center rounded-full border-2 border-card bg-primary font-semibold text-primary-foreground shadow-md" style="width:${size}px;height:${size}px">${label}</div>`,
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

const BASE_LAYER_ICONS: Record<BaseLayerKey, typeof Satellite> = {
  satellite: Satellite,
  terrain: Mountain,
};

function FitToMarkers({ analyses, maxZoom }: { analyses: LocatedAnalysis[]; maxZoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (analyses.length === 0) return;
    const bounds = L.latLngBounds(analyses.map((a) => [a.lat, a.lon] as [number, number]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom });
  }, [map, analyses, maxZoom]);

  return null;
}

// Runs after FitToMarkers -- lands on the overview bounds first, then flies in on the
// specific recording linked to (e.g. via a Recordings page "open on map" action).
function FlyToFocus({ target }: { target: LocatedAnalysis | null }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.lat, target.lon], 15);
  }, [map, target]);

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
  /** Flies in on this recording's marker once its coordinates are known (e.g. deep-linked from another page). */
  focusId?: number | null;
  className?: string;
  /** Controlled by the caller now (the Map page's own filters card) -- these defaults match
   * the compact/dashboard preview's fixed behavior, which has no chrome to toggle them.
   * Ignored when `showLocationsToggle` is set -- that switch drives both internally. */
  showMarkers?: boolean;
  showHeatmap?: boolean;
  /** Cap on how far FitToMarkers may zoom in. Higher for single-recording focus
   * previews (e.g. the recording detail panel) than the default multi-marker overview. */
  fitMaxZoom?: number;
  /** Renders a floating Recordings/Heatmap switch over the map -- same placement and
   * styling as the satellite/terrain layer toggle below -- and drives showMarkers/
   * showHeatmap, base-tile grayscaling, and the pin/cluster metric internally from it.
   * Used by the Dashboard's compact preview, which has no external filters chrome of
   * its own (unlike the full Map page) to host these controls. */
  showLocationsToggle?: boolean;
}

type LocationsView = 'recordings' | 'heatmap';

export function MapView({
  analyses,
  compact = false,
  onMarkerClick,
  selectedId,
  focusId = null,
  className,
  showMarkers = true,
  showHeatmap = false,
  fitMaxZoom = 14,
  showLocationsToggle = false,
}: MapViewProps) {
  const { t } = useTranslation();
  const focusTarget = useMemo(() => analyses.find((a) => a.id === focusId) ?? null, [analyses, focusId]);
  // Compact previews (e.g. the dashboard) have no chrome to switch layers, so
  // they default to terrain -- easier to read at a glance than satellite imagery.
  const [baseLayer, setBaseLayer] = useState<BaseLayerKey>(compact ? 'terrain' : 'satellite');
  // 'recordings' (grouped recording counts, closest to the map's long-standing pin look)
  // is the default; the grayscale-map heatmap is an opt-in alternate lens, not the first
  // thing shown. Only read when `showLocationsToggle` is set.
  const [locationsView, setLocationsView] = useState<LocationsView>('recordings');
  const effectiveShowMarkers = showLocationsToggle ? locationsView === 'recordings' : showMarkers;
  const effectiveShowHeatmap = showLocationsToggle ? locationsView === 'heatmap' : showHeatmap;
  const grayscaleBase = showLocationsToggle && locationsView === 'heatmap';
  const pinMetric: PinMetric = showLocationsToggle ? 'recordings' : 'detections';

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
        className={cn('h-full w-full', grayscaleBase && 'birdnet-grayscale-tiles')}
      >
        <TileLayer key={baseLayer} attribution={BASE_LAYERS[baseLayer].attribution} url={BASE_LAYERS[baseLayer].url} />
        <MapResizeHandler />
        <FitToMarkers analyses={analyses} maxZoom={fitMaxZoom} />
        <FlyToFocus target={focusTarget} />
        {effectiveShowHeatmap && <HeatmapLayer points={heatPoints} />}
        {effectiveShowMarkers && (
          <MarkerClusterGroup
            // Remounts the whole cluster group when the metric switches -- leaflet.markercluster
            // doesn't re-run iconCreateFunction against already-built clusters just because the
            // option reference changed, so a fresh mount (same trick as TileLayer's `key={baseLayer}`
            // above) is the reliable way to guarantee every cluster icon reflects the new metric.
            key={pinMetric}
            chunkedLoading
            disableClusteringAtZoom={compact ? undefined : 16}
            showCoverageOnHover={false}
            iconCreateFunction={(cluster: { getChildCount(): number; getAllChildMarkers(): MetricMarker[] }) =>
              buildClusterIcon(cluster, pinMetric)
            }
          >
            {analyses.map((analysis) => {
              const selected = selectedId === analysis.id;
              const speciesCounts = speciesDistribution([analysis]);
              const location = formatLocation(analysis);
              // In 'recordings' mode a lone, ungrouped pin represents exactly one
              // recording -- not interesting to spell out, so it's forced to the same
              // "nothing to show" value a real zero would get (see buildPinIcon). Only
              // once leaflet.markercluster merges several pins together does the count
              // (via buildClusterIcon's childCount) become worth showing.
              const pinValue = pinMetric === 'recordings' ? 0 : analysis.detectionCount;
              return (
                <Marker
                  key={analysis.id}
                  position={[analysis.lat, analysis.lon]}
                  icon={buildPinIcon(selected, selected && compact, pinValue)}
                  zIndexOffset={selected ? 1000 : 0}
                  // Leaflet's default marker cursor is `pointer` regardless of whether anything
                  // is actually wired to click it -- without an `onMarkerClick` (the dashboard/
                  // detail-panel previews never pass one), that reads as "this is clickable" on
                  // an otherwise non-interactive preview map. `interactive={false}` drops both
                  // the pointer cursor and click/hover handling for those callers.
                  interactive={Boolean(onMarkerClick)}
                  // Hands this marker's detection count to the parent cluster group -- see
                  // MetricMarker/buildClusterIcon above.
                  ref={(marker) => {
                    if (marker) (marker as MetricMarker).birdnetDetectionCount = analysis.detectionCount;
                  }}
                  eventHandlers={onMarkerClick ? { click: () => onMarkerClick(analysis) } : undefined}
                >
                  {!compact && (
                    // `permanent` isn't reactive in Leaflet once a tooltip is created -- the
                    // `key` forces react-leaflet to unmount/remount the tooltip (fresh Leaflet
                    // instance) whenever selection toggles, so a focused marker's tooltip
                    // actually switches from hover-only to always-shown.
                    <Tooltip
                      key={selected ? 'pinned' : 'unpinned'}
                      direction="top"
                      // Tight to the dot's own visible edge (half its size) plus a small
                      // gap for the arrow -- the two pin sizes need different offsets or
                      // the larger selected dot would leave a visible gap under the arrow.
                      offset={selected ? [0, -19] : [0, -17]}
                      permanent={selected}
                      // Leaflet's own default (0.9) is set as an inline style, which beats our
                      // CSS class on specificity -- has to be overridden here, not in index.css.
                      opacity={1}
                      className={cn('birdnet-tooltip', selected && 'birdnet-tooltip-focused')}
                    >
                      {/* min-width keeps a short-content tooltip (e.g. no species detected) from
                          shrinking down to whatever its narrowest line happens to need -- Leaflet's
                          tooltip container is absolutely positioned with an auto width, so with only
                          `max-width` it shrink-to-fits well below a comfortable reading width. */}
                      <div className="min-w-[190px] max-w-[260px] space-y-1.5 text-xs">
                        <div>
                          <p className="font-semibold text-foreground">
                            {t('recordings.label', { id: analysis.id })}
                            <span className="font-normal text-muted-foreground">, {formatDateShort(analysis.createdAt)}</span>
                          </p>
                          {location && <p className="text-muted-foreground">{location}</p>}
                        </div>
                        <SpeciesBadgeList
                          species={speciesCounts}
                          limit={4}
                          showCount={false}
                          size="sm"
                          emptyLabel={t('recordings.detail.noSpeciesDetected')}
                        />
                      </div>
                    </Tooltip>
                  )}
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {!compact && (
        // Bigger, icon-labeled, and with a bold solid `bg-primary` active state (rather than
        // the subtle default `bg-card` toggle look) -- this is an easy-to-miss feature
        // otherwise, sitting quietly in a corner of a busy satellite map.
        <div className="absolute right-3 top-3 z-20 rounded-lg border border-border bg-card/95 p-1.5 shadow-md">
          <ToggleGroup type="single" value={baseLayer} onValueChange={(value) => value && setBaseLayer(value as BaseLayerKey)}>
            {Object.keys(BASE_LAYERS).map((key) => {
              const Icon = BASE_LAYER_ICONS[key as BaseLayerKey];
              return (
                <ToggleGroupItem
                  key={key}
                  value={key}
                  size="default"
                  className="gap-1.5 px-3 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none"
                >
                  <Icon className="size-4" />
                  {t(BASE_LAYER_LABEL_KEYS[key as BaseLayerKey])}
                </ToggleGroupItem>
              );
            })}
          </ToggleGroup>
        </div>
      )}

      {showLocationsToggle && (
        // Same placement/styling as the satellite/terrain toggle above -- bigger,
        // icon-labeled, bold solid `bg-primary` active state -- so the two floating
        // switches (this one only ever shown on the compact dashboard preview, that one
        // only on the full interactive map) read as one consistent map control language.
        <div className="absolute right-3 top-3 z-20 rounded-lg border border-border bg-card/95 p-1.5 shadow-md">
          <ToggleGroup
            type="single"
            value={locationsView}
            onValueChange={(value) => value && setLocationsView(value as LocationsView)}
          >
            <ToggleGroupItem
              value="recordings"
              size="default"
              className="gap-1.5 px-3 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none"
            >
              <AudioLines className="size-4" />
              {t('common.recordings')}
            </ToggleGroupItem>
            <ToggleGroupItem
              value="heatmap"
              size="default"
              className="gap-1.5 px-3 text-sm font-medium data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-none"
            >
              <Flame className="size-4" />
              {t('map.heatmapLabel')}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
}
