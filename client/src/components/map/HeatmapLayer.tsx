import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  /** [lat, lon, intensity] tuples -- intensity is required by leaflet.heat's types. */
  points: Array<[number, number, number]>;
}

/** Thin imperative wrapper around leaflet.heat -- react-leaflet has no first-class heat layer. */
export function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const layer = L.heatLayer(points, { radius: 28, blur: 22, maxZoom: 17 });
    layer.addTo(map);

    return () => {
      layer.remove();
    };
  }, [map, points]);

  return null;
}
