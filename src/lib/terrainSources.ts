/**
 * Terrain sources for the admin's MapLibre views.
 *
 * Each source is a complete description of how to wire a MapLibre
 * `raster-dem` source — tile URL template, encoding, attribution — plus
 * an optional matching vector basemap style. The "Premium" source also
 * surfaces whether a key is configured; callers can short-circuit and
 * show a setup hint when the key is missing.
 *
 * Adding a new source is a one-liner: drop an entry into SOURCES and
 * add the matching label to TerrainSource. The /map page and the
 * Map3DEditor read the same array, so a new option shows up everywhere
 * automatically.
 */
export type TerrainSource = 'aws' | 'premium' | 'cesium';

/** MapLibre `raster-dem` source config. */
export interface DemSourceConfig {
  /** URL template, e.g. `https://.../{z}/{x}/{y}.png`. */
  tiles: string[];
  tileSize: 256 | 512;
  /** MapLibre DEM encoding: terrarium (R*256+G+128*256*256+B) or
   *  mapbox (R*256*256+G*256+B-10000). MapTiler uses mapbox. */
  encoding: 'terrarium' | 'mapbox';
  maxzoom: number;
  /** Attribution shown in the MapLibre attribution control. */
  attribution: string;
  /** Vertical exaggeration for setTerrain (1.0 = true, 1.4 = punchy). */
  exaggeration: number;
}

/** Vector basemap style URL — for Premium, MapTiler's "outdoor" style. */
export interface BasemapStyleConfig {
  /** URL template or inline style JSON URL. */
  styleUrl?: string;
  /** Attribution text. */
  attribution: string;
}

export interface TerrainSourceConfig {
  id: TerrainSource;
  /** Short label used in the toggle UI. */
  label: string;
  /** Tooltip text for the toggle button. */
  hint: string;
  dem: DemSourceConfig;
  /** Optional premium basemap. When supplied, the basemap toggle on the
   *  page swaps to this URL in Premium mode (instead of the default
   *  OpenFreeMap / Esri imagery pair). */
  premiumBasemap?: BasemapStyleConfig;
  /** True if a key is required and currently missing. The page renders
   *  a setup hint instead of mounting the map. */
  needsKey?: boolean;
  /** The env-var name to read the key from. */
  keyEnvVar?: string;
}

/* ── Source table ─────────────────────────────────────────── */

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;

export const TERRAIN_SOURCES: Record<TerrainSource, TerrainSourceConfig> = {
  aws: {
    id: 'aws',
    label: 'AWS',
    hint: 'MapLibre · AWS Open Terrain Tiles (terrarium)',
    dem: {
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      tileSize: 256,
      encoding: 'terrarium',
      maxzoom: 15,
      attribution: 'Terrain: AWS Open Data',
      exaggeration: 1.4,
    },
  },
  premium: {
    id: 'premium',
    label: 'PREMIUM',
    hint: 'MapLibre · MapTiler terrain-rgb (premium quality)',
    dem: {
      tiles: MAPTILER_KEY
        ? [`https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`]
        : [],
      tileSize: 512,
      encoding: 'mapbox',
      maxzoom: 14,
      attribution: 'Terrain © MapTiler',
      exaggeration: 1.4,
    },
    premiumBasemap: MAPTILER_KEY
      ? {
          styleUrl: `https://api.maptiler.com/maps/outdoor/style.json?key=${MAPTILER_KEY}`,
          attribution: '© MapTiler · © OpenStreetMap contributors',
        }
      : undefined,
    needsKey: !MAPTILER_KEY,
    keyEnvVar: 'NEXT_PUBLIC_MAPTILER_KEY',
  },
  cesium: {
    id: 'cesium',
    label: 'CESIUM',
    hint: 'Cesium World Terrain · Cesium ion asset 1',
    // cesium source is rendered via the CesiumViewer, not MapLibre, so
    // the DEM config here is only a placeholder.
    dem: {
      tiles: [],
      tileSize: 256,
      encoding: 'terrarium',
      maxzoom: 15,
      attribution: 'Cesium ion',
      exaggeration: 1.0,
    },
  },
};

/** Order the toggle buttons should appear in. */
export const TERRAIN_ORDER: TerrainSource[] = ['aws', 'premium', 'cesium'];

/**
 * Filtered view of TERRAIN_ORDER that drops any source whose required
 * key is missing. The /map page and Map3DEditor use this for the toggle
 * buttons so users without a MapTiler key never see a "click → hint"
 * dead end. Cesium always passes through — it has a hardcoded dev
 * fallback token in `CesiumViewer`, and a user-supplied token via
 * NEXT_PUBLIC_CESIUM_ION_TOKEN in production.
 */
export function getAvailableTerrainSources(): TerrainSource[] {
  return TERRAIN_ORDER.filter((t) => !TERRAIN_SOURCES[t].needsKey);
}
