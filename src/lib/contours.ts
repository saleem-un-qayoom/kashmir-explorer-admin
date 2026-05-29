/**
 * Contour line support for the admin maps.
 *
 * Uses `maplibre-contour` to generate contour vector tiles on the client from
 * the same AWS terrarium DEM the maps already load — no external contour
 * service and no API key. The DEM source registers a `mlcontour://` protocol
 * on MapLibre exactly once (singleton), then each map adds a vector source +
 * line/label layers driven by `contourTileUrl()`.
 */
import maplibregl from 'maplibre-gl';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import mlcontour from 'maplibre-contour';

const DEM_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let demSource: any = null;

/** Lazily build the DemSource and register the mlcontour protocol (once). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDemSource(): any {
  if (!demSource) {
    demSource = new mlcontour.DemSource({
      url: DEM_URL,
      encoding: 'terrarium',
      maxzoom: 15,
      worker: true,
    });
    demSource.setupMaplibre(maplibregl);
  }
  return demSource;
}

/**
 * Contour tile URL. Thresholds are [minor-interval, major-interval] in metres,
 * keyed by zoom — denser contours as you zoom in. Elevation is in metres
 * (terrarium is already metres, so multiplier = 1).
 */
export function contourTileUrl(): string {
  return getDemSource().contourProtocolUrl({
    multiplier: 1,
    thresholds: {
      9:  [200, 1000],
      11: [100, 500],
      13: [50, 250],
      14: [25, 100],
      15: [20, 100],
    },
    elevationKey: 'ele',
    levelKey: 'level',
    contourLayer: 'contours',
  });
}

/**
 * Add contour line + elevation-label layers to a map. Inserts beneath
 * `beforeId` (the first symbol layer) so place labels stay on top.
 */
export function addContourLayers(
  map: maplibregl.Map,
  beforeId?: string,
): void {
  if (map.getSource('contours')) return;

  map.addSource('contours', {
    type: 'vector',
    tiles: [contourTileUrl()],
    maxzoom: 15,
  });

  map.addLayer(
    {
      id: 'contour-lines',
      type: 'line',
      source: 'contours',
      'source-layer': 'contours',
      layout: { visibility: 'none', 'line-join': 'round' },
      paint: {
        'line-color': 'rgba(90, 70, 48, 0.5)',
        // Index (major) contours thicker than the minor ones.
        'line-width': ['match', ['get', 'level'], 1, 1.4, 0.6],
      },
    },
    beforeId,
  );

  map.addLayer(
    {
      id: 'contour-labels',
      type: 'symbol',
      source: 'contours',
      'source-layer': 'contours',
      // Only label index (major) contours to avoid clutter.
      filter: ['>', ['get', 'level'], 0],
      layout: {
        visibility: 'none',
        'symbol-placement': 'line',
        'text-size': 10,
        'text-field': ['concat', ['number-format', ['get', 'ele'], { 'max-fraction-digits': 0 }], ' m'],
        'text-font': ['Noto Sans Regular'],
        'text-max-angle': 25,
      },
      paint: {
        'text-color': '#5a4630',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1.4,
      },
    },
    beforeId,
  );
}

/** Show / hide the contour layers. */
export function setContourVisibility(map: maplibregl.Map, visible: boolean): void {
  const v = visible ? 'visible' : 'none';
  if (map.getLayer('contour-lines')) map.setLayoutProperty('contour-lines', 'visibility', v);
  if (map.getLayer('contour-labels')) map.setLayoutProperty('contour-labels', 'visibility', v);
}
