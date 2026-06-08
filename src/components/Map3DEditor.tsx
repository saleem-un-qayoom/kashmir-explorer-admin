/**
 * Map3DEditor — free 3D map editor for trails and multi-destination layouts.
 *
 *  • MapLibre GL JS (MIT, no API key)
 *  • OpenFreeMap "liberty" vector basemap (AWS terrain) or
 *    MapTiler outdoor style + terrain-rgb (Premium — needs key)
 *  • AWS Open Terrain Tiles (terrain-rgb) → real 3D relief
 *  • Sky atmosphere
 *  • mapbox-gl-draw fork (compatible with MapLibre) for line + point
 *    drawing tools. Trails are emitted as a LineString polyline;
 *    destination markers are emitted as Point features.
 *
 *  • Optional Cesium World Terrain (Cesium ion asset 1) as a read-only
 *    preview. The terrain toggle includes a "Cesium World" pill that
 *    swaps the editable MapLibre canvas for a Cesium globe. Drawing
 *    tools are hidden in Cesium mode — it's a QA / screenshot surface,
 *    not an editor.
 *
 * Three terrain sources (toolbar toggle):
 *   • AWS      — MapLibre + AWS terrarium DEM, no key, default
 *   • Premium  — MapLibre + MapTiler terrain-rgb, needs NEXT_PUBLIC_MAPTILER_KEY
 *   • Cesium   — Cesium World Terrain, read-only, needs token
 *
 * Both `polyline` (LineString) and `points` (markers) can be controlled.
 * The editor calls `onChange` whenever the user edits either.
 *
 *   <Map3DEditor
 *     polyline={[[lng, lat], …]}
 *     points={[{ lng, lat, label }]}
 *     onChange={({ polyline, points }) => …}
 *   />
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MLMap, NavigationControl } from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import dynamic from 'next/dynamic';
import { Path as PathIcon, MapPin, Cursor, Trash, House, Ruler, Mountains, Waveform } from '@phosphor-icons/react';
import { addContourLayers, setContourVisibility } from '@/lib/contours';
import { TERRAIN_SOURCES, getAvailableTerrainSources } from '@/lib/terrainSources';

// Cesium globe — read-only preview. Imported dynamically with ssr:false
// because Cesium reads `window` at import time.
const CesiumViewer = dynamic(
  () => import('./CesiumViewer').then((m) => m.CesiumViewer),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-pashmina text-ink-3 text-xs font-mono">
        Loading Cesium globe…
      </div>
    ),
  },
);

export interface DestinationPin {
  lng: number;
  lat: number;
  label?: string;
  id?: string;
  /** Which day this pin belongs to (for multi-day treks). 1-indexed. */
  day?: number;
}

/** A single day-segment in a multi-day trek. */
export interface PhaseSegment {
  day: number;
  coordinates: [number, number][];
}

interface Props {
  /** Single polyline (legacy, single-day shape). */
  polyline?: [number, number][];
  /** Multi-day shape — when supplied, the editor renders day pills + draws
   *  per-day color-coded LineStrings. The active day is what `Draw trail`
   *  appends to. */
  phases?: PhaseSegment[];
  /** Destination/waypoint pins. */
  points?: DestinationPin[];
  /** Initial centre — defaults to Srinagar. */
  center?: { lng: number; lat: number };
  zoom?: number;
  height?: number;
  /** Show the line-drawing tool. Default true (for treks). */
  enableTrail?: boolean;
  /** Show the point-drawing tool. Default true (for waypoints / multi-dest). */
  enablePoints?: boolean;
  /** Fired whenever the user adds / moves / deletes a shape. */
  onChange?: (next: {
    polyline: [number, number][];
    points: DestinationPin[];
    phases?: PhaseSegment[];
  }) => void;
}

/** Day-color cycle — saffron · dal · emerald · chinar · sapphire · mustard. */
const DAY_COLORS = ['#E8893A', '#2A5266', '#2D6A4F', '#B23A2E', '#1F4788', '#C9A227'];
const dayColor = (d: number) => DAY_COLORS[(d - 1) % DAY_COLORS.length];

/** Esri World Imagery — free, no key. Real aerial so ridges/cliffs read true on the relief. */
const SATELLITE_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

/** First symbol (label) layer id — raster layers go beneath it so labels stay on top. */
function firstSymbolLayerId(map: MLMap): string | undefined {
  return map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
}

export function Map3DEditor({
  polyline,
  phases,
  points = [],
  center = { lng: 74.7973, lat: 34.0837 }, // Srinagar
  zoom = 9,
  height = 480,
  enableTrail = true,
  enablePoints = true,
  onChange,
}: Props) {
  // All refs first — order matters for HMR safety.
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MLMap | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const homeRef = useRef<{ center: { lng: number; lat: number }; zoom: number } | null>(null);
  const activeDayRef = useRef<number>(1);

  // Multi-day: derive the working phase list. If `phases` is given, use it;
  // otherwise treat any single `polyline` as Day 1 for backward compat.
  const polylineSafe: [number, number][] = polyline ?? [];
  const initialPhases: PhaseSegment[] =
    phases ?? (polylineSafe.length >= 2 ? [{ day: 1, coordinates: polylineSafe }] : [{ day: 1, coordinates: [] }]);

  const [activeDay, setActiveDay] = useState<number>(initialPhases[0]?.day ?? 1);
  activeDayRef.current = activeDay;
  const [mode, setMode] = useState<'select' | 'draw_line' | 'draw_point'>('select');
  const [basemap, setBasemap] = useState<'satellite' | 'map'>('satellite');
  const [contours, setContours] = useState(false);
  /** Engine selector. Three options:
   *   'aws'     — MapLibre + AWS terrarium DEM, editable, default
   *   'premium' — MapLibre + MapTiler terrain-rgb, editable, needs key
   *   'cesium'  — read-only Cesium World Terrain preview */
  type Terrain = 'aws' | 'premium' | 'cesium';
  const [terrain, setTerrain] = useState<Terrain>('aws');
  const [stats, setStats] = useState<{ points: number; pins: number; distanceKm: number }>({
    points: 0, pins: 0, distanceKm: 0,
  });

  // Available terrain sources (filter out ones whose required key is
  // missing). The toolbar pill uses this so users never see a
  // "click → setup hint" dead end. The Premium pill is hidden entirely
  // when NEXT_PUBLIC_MAPTILER_KEY is unset; Cesium always shows (it has
  // a hardcoded dev fallback token in CesiumViewer).
  const availableTerrains = getAvailableTerrainSources();

  // Effective terrain: clamps the saved state to the currently-available
  // sources. If the env var disappears (or page mounts with stale state)
  // we fall back to 'aws' silently rather than rendering broken.
  const effectiveTerrain: Terrain = availableTerrains.includes(terrain) ? terrain : 'aws';

  // Resolve the active MapLibre DEM config. Now that the toggle only
  // shows sources whose keys are set, the effective terrain equals
  // the user's selection (no fallback path needed).
  const effectiveLibreTerrain: 'aws' | 'premium' =
    effectiveTerrain === 'premium' ? 'premium' : 'aws';
  const demCfg = TERRAIN_SOURCES[effectiveLibreTerrain].dem;
  const styleUrl =
    effectiveLibreTerrain === 'premium'
      ? TERRAIN_SOURCES.premium.premiumBasemap?.styleUrl
      : 'https://tiles.openfreemap.org/styles/liberty';

  // Stable change-handler ref so we can recreate listeners without rebuilding the map.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track which polyline/point set we last seeded the draw store with so
  // we only re-sync when the parent passes genuinely new data (e.g. a GPX
  // file was just uploaded). Identity check by JSON because the parent
  // may pass freshly-constructed arrays each render.
  const lastSeedRef = useRef<string>('');

  /* ── Initialise map (re-builds when the engine or terrain source toggles) ── */

  useEffect(() => {
    if (!containerRef.current) return;
    // Skip MapLibre init only in Cesium mode — both 'aws' and 'premium'
    // are editable MapLibre views.
    if (terrain === 'cesium') return;
    if (!styleUrl) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [center.lng, center.lat],
      zoom,
      pitch: 55,
      bearing: -20,
      maxPitch: 75,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      const beforeId = firstSymbolLayerId(map);

      // Hide the basemap's own place names + road shields to declutter — only
      // our trail waypoint labels and contour labels remain.
      for (const l of map.getStyle().layers ?? []) {
        if (l.type === 'symbol') map.setLayoutProperty(l.id, 'visibility', 'none');
      }

      // 3D terrain — DEM source + setTerrain. The DEM source is resolved
      // by the parent (AWS terrarium for 'aws', MapTiler terrain-rgb for
      // 'premium'), so the same code path handles both.
      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: demCfg.tiles,
        tileSize: demCfg.tileSize,
        encoding: demCfg.encoding,
        maxzoom: demCfg.maxzoom,
        attribution: demCfg.attribution,
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: demCfg.exaggeration });

      // Satellite imagery drape — beneath labels, so the real mountain surface
      // (rock, snow, couloirs) is visible on the 3D relief for accurate routing.
      map.addSource('satellite', {
        type: 'raster',
        tiles: SATELLITE_TILES,
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Imagery © Esri, Maxar, Earthstar Geographics',
      });
      map.addLayer(
        { id: 'satellite', type: 'raster', source: 'satellite', paint: { 'raster-opacity': 1 } },
        beforeId,
      );

      // Sky atmosphere
      map.setSky({
        'sky-color':           '#a8d0f5',
        'sky-horizon-blend':   0.5,
        'horizon-color':       '#ffd9a0',
        'horizon-fog-blend':   0.5,
        'fog-color':           '#f5ebdc',
        'fog-ground-blend':    0.55,
      });

      // Hillshade — reuse the same DEM source; saves a request and keeps
      // the shading consistent with the relief.
      if (!map.getSource('hillshade-src')) {
        map.addLayer({
          id: 'hillshade',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: {
            'hillshade-exaggeration': 0.35,
            'hillshade-shadow-color': '#3D352A',
          },
        }, beforeId);
      }

      // Contour lines (hidden until toggled on).
      addContourLayers(map, beforeId);

      /* ─ Drawing tools (programmatic — our custom toolbar drives them) ─ */
      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {}, // hide the default cryptic icon bar
        styles: drawStyles,
        keybindings: true,
        boxSelect: false,
        clickBuffer: 8,
      });
      // Cast — MapboxDraw expects the Mapbox Map type; MapLibre's runtime
      // is a drop-in replacement.
      map.addControl(draw as unknown as maplibregl.IControl, 'top-left');
      drawRef.current = draw;
      // Remember the camera "home" for the Reset button
      homeRef.current = { center, zoom };

      /* ─ Seed initial features ─ */
      for (const ph of initialPhases) {
        if (ph.coordinates.length >= 2) {
          draw.add({
            type: 'Feature',
            properties: { kind: 'trail', day: ph.day },
            geometry: { type: 'LineString', coordinates: ph.coordinates as any },
          });
        }
      }
      if (points.length) {
        for (const p of points) {
          draw.add({
            type: 'Feature',
            properties: { kind: 'waypoint', label: p.label ?? '', day: p.day ?? activeDay },
            geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          });
        }
      }

      const emit = () => {
        const all = draw.getAll();
        const phasesOut = new globalThis.Map<number, [number, number][]>();
        const pointsOut: DestinationPin[] = [];
        for (const f of all.features) {
          if (f.geometry.type === 'LineString') {
            // Tag untagged features (freshly drawn) with the active day.
            let day = (f.properties as any)?.day as number | undefined;
            if (!day) {
              day = activeDayRef.current;
              draw.setFeatureProperty(f.id as string, 'day', day);
              // Recolor by re-adding (gl-draw doesn't react to property changes for line color).
            }
            const coords = f.geometry.coordinates.map(([lng, lat]: [number, number]) => [lng, lat]) as [number, number][];
            phasesOut.set(day, coords);
          } else if (f.geometry.type === 'Point') {
            const [lng, lat] = f.geometry.coordinates;
            const day = ((f.properties as any)?.day as number) ?? activeDayRef.current;
            pointsOut.push({ lng, lat, label: (f.properties?.label as string) ?? '', day });
          }
        }
        const phasesArr: PhaseSegment[] = Array.from(phasesOut.entries())
          .map(([day, coordinates]) => ({ day, coordinates }))
          .sort((a, b) => a.day - b.day);
        const totalPts = phasesArr.reduce((s, p) => s + p.coordinates.length, 0);
        const totalKm  = phasesArr.reduce((s, p) => s + polylineKm(p.coordinates), 0);
        setStats({ points: totalPts, pins: pointsOut.length, distanceKm: totalKm });

        // Backwards-compatible payload: surface the single largest polyline as
        // `polyline` for non-phase consumers, plus the full `phases` array.
        const longest = phasesArr.reduce((a, b) => (b.coordinates.length > a.coordinates.length ? b : a),
          { day: 0, coordinates: [] as [number, number][] }).coordinates;
        onChangeRef.current?.({ polyline: longest, points: pointsOut, phases: phasesArr });
      };

      map.on('draw.create', emit);
      map.on('draw.update', emit);
      map.on('draw.delete', emit);
      // Snap our mode pill back to "Select" when the user finishes a feature.
      map.on('draw.modechange', (e: any) => {
        const m = e.mode as string;
        if (m.startsWith('draw_line')) setMode('draw_line');
        else if (m.startsWith('draw_point')) setMode('draw_point');
        else setMode('select');
      });

      // Initial stat snapshot so the panel isn't blank.
      emit();

      /* ─ Day-color overlay ─
       *
       * mapbox-gl-draw doesn't paint LineString features by data-driven
       * property, so for multi-day treks we mirror the draw store into a
       * separate GeoJSON source/layer that paints by `day`. The user
       * still selects + edits via gl-draw; we just add a colored line
       * underneath.
       */
      map.addSource('phases-display', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'phases-display-line',
        type: 'line',
        source: 'phases-display',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': [
            'match',
            ['%', ['get', 'day'], DAY_COLORS.length],
            0, DAY_COLORS[0],
            1, DAY_COLORS[1],
            2, DAY_COLORS[2],
            3, DAY_COLORS[3],
            4, DAY_COLORS[4],
            5, DAY_COLORS[5],
            '#999',
          ] as any,
          'line-width': 5,
          'line-opacity': 0.75,
        },
      }, 'gl-draw-line-inactive.cold');

      const refreshPhasesDisplay = () => {
        const src = map.getSource('phases-display') as any;
        if (!src) return;
        const fc = {
          type: 'FeatureCollection',
          features: draw.getAll().features
            .filter((f: any) => f.geometry.type === 'LineString')
            .map((f: any) => ({
              type: 'Feature',
              properties: { day: ((f.properties?.day as number) ?? activeDayRef.current) - 1 },
              geometry: f.geometry,
            })),
        };
        src.setData(fc);
      };
      map.on('draw.create', refreshPhasesDisplay);
      map.on('draw.update', refreshPhasesDisplay);
      map.on('draw.delete', refreshPhasesDisplay);
      refreshPhasesDisplay();

      // Fit camera to every phase + every waypoint.
      const allCoords: [number, number][] = initialPhases.flatMap((p) => p.coordinates);
      if (allCoords.length || points.length) {
        const bounds = new maplibregl.LngLatBounds();
        allCoords.forEach(([lng, lat]) => bounds.extend([lng, lat]));
        points.forEach((p) => bounds.extend([p.lng, p.lat]));
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, duration: 0 });
      }
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      drawRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLibreTerrain]);

  /* ── Re-seed draw store when parent supplies new data (GPX upload, etc.) ── */
  useEffect(() => {
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!map || !draw) return;

    // Phase-aware re-seed: prefer `phases` if provided, else legacy polyline.
    const incomingPhases: PhaseSegment[] =
      phases ?? (polylineSafe.length >= 2 ? [{ day: 1, coordinates: polylineSafe }] : []);

    const seed = JSON.stringify({ phases: incomingPhases, points });
    if (seed === lastSeedRef.current) return;
    lastSeedRef.current = seed;

    draw.deleteAll();

    for (const ph of incomingPhases) {
      if (ph.coordinates.length >= 2) {
        draw.add({
          type: 'Feature',
          properties: { kind: 'trail', day: ph.day },
          geometry: { type: 'LineString', coordinates: ph.coordinates as any },
        });
      }
    }
    for (const p of points) {
      draw.add({
        type: 'Feature',
        properties: { kind: 'waypoint', label: p.label ?? '', day: p.day ?? 1 },
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      });
    }

    // Fit to everything
    const bounds = new maplibregl.LngLatBounds();
    incomingPhases.forEach((ph) => ph.coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat])));
    points.forEach((p) => bounds.extend([p.lng, p.lat]));
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 60, duration: 800, pitch: 50 } as any);
    }

    // Trigger emit so stats + color overlay refresh
    setTimeout(() => map.fire('draw.update' as any), 0);
  }, [phases, polyline, points]);

  /* ── Basemap toggle (satellite imagery ⇆ clean vector map) ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer('satellite')) return;
      map.setLayoutProperty('satellite', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      if (map.getLayer('hillshade')) {
        map.setPaintProperty('hillshade', 'hillshade-exaggeration', basemap === 'satellite' ? 0.35 : 0.6);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [basemap]);

  /* ── Contour-line toggle ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => setContourVisibility(map, contours);
    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [contours]);

  /* ─── Toolbar actions ─── */

  const setDrawMode = (m: 'select' | 'draw_line' | 'draw_point') => {
    const draw = drawRef.current;
    if (!draw) return;
    if (m === 'select') draw.changeMode('simple_select');
    if (m === 'draw_line') draw.changeMode('draw_line_string');
    if (m === 'draw_point') draw.changeMode('draw_point');
    setMode(m);
  };

  const deleteSelected = () => {
    const draw = drawRef.current;
    if (!draw) return;
    const sel = draw.getSelectedIds?.() ?? [];
    if (sel.length === 0) {
      alert('Click a trail vertex or a waypoint pin first, then press Delete.');
      return;
    }
    draw.delete(sel);
    // Trigger the emit pipeline manually since delete() doesn't fire draw.delete.
    setTimeout(() => mapRef.current?.fire('draw.delete' as any), 0);
  };

  const flyHome = () => {
    const map = mapRef.current;
    const home = homeRef.current;
    if (!map || !home) return;
    map.flyTo({ center: [home.center.lng, home.center.lat], zoom: home.zoom, pitch: 55, bearing: -20, duration: 800 });
  };

  /* ─ Multi-day phase actions ─ */

  /** Existing day numbers in the draw store, sorted asc. */
  const currentDays = (): number[] => {
    const draw = drawRef.current;
    if (!draw) return [1];
    const days = new Set<number>();
    for (const f of draw.getAll().features) {
      if (f.geometry.type === 'LineString') {
        days.add(((f.properties as any)?.day as number) ?? 1);
      }
    }
    if (!days.size) days.add(1);
    return Array.from(days).sort((a, b) => a - b);
  };

  const addDay = () => {
    const days = currentDays();
    const next = (days[days.length - 1] ?? 0) + 1;
    setActiveDay(next);
    drawRef.current?.changeMode('draw_line_string' as any);
    setMode('draw_line');
  };

  const deleteDay = (day: number) => {
    const draw = drawRef.current;
    if (!draw) return;
    if (!confirm(`Delete every trail point and waypoint tagged Day ${day}?`)) return;
    const ids: string[] = [];
    for (const f of draw.getAll().features) {
      const fDay = ((f.properties as any)?.day as number) ?? 1;
      if (fDay === day) ids.push(f.id as string);
    }
    if (ids.length) draw.delete(ids);
    setTimeout(() => mapRef.current?.fire('draw.delete' as any), 0);
    // Switch to a remaining day or fall back to 1
    const remaining = currentDays().filter((d) => d !== day);
    setActiveDay(remaining[0] ?? 1);
  };

  return (
    <div className="space-y-2">
      {/* Day pills — multi-day phase selector */}
      <div className="flex flex-wrap items-center gap-1">
        {currentDays().map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setActiveDay(d)}
            className={`group inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full border text-xs font-medium transition ${
              d === activeDay
                ? 'text-white border-transparent shadow-sm'
                : 'bg-white text-ink border-line hover:border-kong'
            }`}
            style={d === activeDay ? { backgroundColor: dayColor(d) } : undefined}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: d === activeDay ? '#fff' : dayColor(d) }}
            />
            Day {d}
            {currentDays().length > 1 && (
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); deleteDay(d); }}
                className={`ml-0.5 w-4 h-4 rounded-full inline-flex items-center justify-center opacity-60 hover:opacity-100 ${
                  d === activeDay ? 'hover:bg-white/25' : 'hover:bg-pashmina'
                }`}
                title={`Delete Day ${d}`}
              >
                ×
              </span>
            )}
          </button>
        ))}
        <button
          type="button"
          onClick={addDay}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-kong text-xs font-medium text-kong hover:bg-kong/5 transition"
        >
          + Add day
        </button>
        <span className="text-[10px] text-ink-3 ml-auto font-mono tracking-wider">
          ACTIVE DAY · NEW TRAILS WILL BE TAGGED · DAY {activeDay}
        </span>
      </div>

      <div className="relative rounded-card border border-line overflow-hidden bg-pashmina">
        {terrain === 'cesium' ? (
          <CesiumViewer
            polyline={polylineSafe.length >= 2 ? polylineSafe : undefined}
            phases={initialPhases}
            points={points}
            center={center}
            zoom={zoom}
            basemap={basemap}
            height={height}
          />
        ) : (
          <div ref={containerRef} style={{ height, width: '100%' }} />
        )}

        {/* Floating toolbar — labelled buttons, not cryptic icons */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2 pointer-events-none">
          <div className="flex gap-1 p-1 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm pointer-events-auto">
            {terrain === 'cesium' ? (
              <>
                <TbBtn
                  active={basemap === 'satellite'}
                  onClick={() => setBasemap((b) => (b === 'satellite' ? 'map' : 'satellite'))}
                  icon={<Mountains size={14} weight="bold" />}
                  label={basemap === 'satellite' ? 'Satellite' : 'Map'}
                  hint="Toggle Bing Aerial / OSM imagery on the Cesium globe"
                />
                <span className="flex items-center px-2.5 py-1.5 text-[10px] font-mono tracking-wider text-ink-3">
                  READ-ONLY PREVIEW
                </span>
              </>
            ) : (
              <>
                <TbBtn
                  active={mode === 'select'}
                  onClick={() => setDrawMode('select')}
                  icon={<Cursor size={14} weight="bold" />}
                  label="Select"
                  hint="Click vertices or pins to move them"
                />
                {enableTrail && (
                  <TbBtn
                    active={mode === 'draw_line'}
                    onClick={() => setDrawMode('draw_line')}
                    icon={<PathIcon size={14} weight="bold" />}
                    label="Draw trail"
                    hint="Click along the map · double-click to finish"
                  />
                )}
                {enablePoints && (
                  <TbBtn
                    active={mode === 'draw_point'}
                    onClick={() => setDrawMode('draw_point')}
                    icon={<MapPin size={14} weight="bold" />}
                    label="Add waypoint"
                    hint="Click anywhere to drop a pin"
                  />
                )}
                <div className="w-px bg-line mx-0.5 self-stretch" />
                <TbBtn
                  onClick={deleteSelected}
                  icon={<Trash size={14} weight="bold" />}
                  label="Delete"
                  hint="Removes the selected vertex / pin"
                  danger
                />
                <TbBtn
                  onClick={flyHome}
                  icon={<House size={14} weight="bold" />}
                  label="Reset view"
                  hint="Re-centre on Kashmir"
                />
                <div className="w-px bg-line mx-0.5 self-stretch" />
                <TbBtn
                  active={basemap === 'satellite'}
                  onClick={() => setBasemap((b) => (b === 'satellite' ? 'map' : 'satellite'))}
                  icon={<Mountains size={14} weight="bold" />}
                  label={basemap === 'satellite' ? 'Satellite' : 'Map'}
                  hint="Toggle satellite imagery / vector map drape"
                />
                <TbBtn
                  active={contours}
                  onClick={() => setContours((c) => !c)}
                  icon={<Waveform size={14} weight="bold" />}
                  label="Contours"
                  hint="Toggle contour lines with elevation labels"
                />
              </>
            )}
            <div className="w-px bg-line mx-0.5 self-stretch" />
            {/* Terrain pill: shows only sources whose required key is set.
             *  Premium is hidden entirely when NEXT_PUBLIC_MAPTILER_KEY is
             *  unset, so the toggle is never "click → setup hint" dead end. */}
            <div className="flex gap-0.5 p-0.5 bg-pashmina/60 rounded-sm">
              {availableTerrains.map((t) => {
                const isActive = effectiveTerrain === t;
                const isAws = t === 'aws';
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTerrain(t)}
                    className={`px-2 py-1 text-[10px] font-mono tracking-wider rounded-[3px] transition flex items-center gap-0.5 ${
                      isActive ? 'bg-dal text-white' : 'text-ink-3 hover:text-ink'
                    }`}
                    title={TERRAIN_SOURCES[t].hint}
                  >
                    {t === 'aws' ? 'AWS'
                     : t === 'premium' ? 'PREMIUM'
                     : 'CESIUM'}
                    {isAws && !isActive && (
                      <span className="text-emerald" title="Default — free, no key">●</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stats panel */}
          <div className="flex gap-2 p-2 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm pointer-events-auto text-[11px] font-mono tracking-wider">
            <span className="text-ink-3">TRAIL</span>
            <span className="text-ink font-semibold">{stats.points} pts</span>
            <span className="text-ink-3">·</span>
            <span className="text-ink-3 flex items-center gap-1"><Ruler size={12} weight="bold" /></span>
            <span className="text-ink font-semibold">{stats.distanceKm.toFixed(1)} km</span>
            <span className="text-ink-3">·</span>
            <span className="text-ink-3">WPTS</span>
            <span className="text-ink font-semibold">{stats.pins}</span>
          </div>
        </div>

        {/* Inline help bar — slides in only when drawing (MapLibre mode only) */}
        {effectiveTerrain !== 'cesium' && (mode === 'draw_line' || mode === 'draw_point') && (
          <div className="absolute bottom-3 left-3 right-3 mx-auto max-w-md pointer-events-none">
            <div className="px-3 py-2 rounded-btn bg-dal text-white text-xs font-medium shadow-warm text-center">
              {mode === 'draw_line'
                ? 'Click points along the trail · double-click to finish · press Esc to cancel'
                : 'Click anywhere on the map to drop a waypoint'}
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-ink-3 font-mono tracking-wider leading-relaxed">
        · DRAG TO PAN · RIGHT-DRAG TO TILT/ROTATE · SCROLL TO ZOOM ·{' '}
        {effectiveTerrain === 'aws' && <>IMAGERY: ESRI · MAP: <a href="https://openfreemap.org" className="underline">OpenFreeMap</a> · DEM: AWS OPEN TERRAIN TILES</>}
        {effectiveTerrain === 'premium' && <>IMAGERY: ESRI · MAP: MAPTILER OUTDOOR · DEM: MAPTILER TERRAIN-RGB</>}
        {effectiveTerrain === 'cesium' && <>TERRAIN: CESIUM WORLD TERRAIN (ION ASSET 1) · IMAGERY: BING AERIAL / OSM · READ-ONLY</>}
      </p>
    </div>
  );
}

/* ─── Toolbar button ──────────────────────────────────────── */

function TbBtn({
  active, onClick, icon, label, hint, danger,
}: {
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={hint}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-medium transition ${
        active
          ? 'bg-kong text-white'
          : danger
            ? 'text-chinar hover:bg-chinar/10'
            : 'text-ink hover:bg-pashmina/60'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/* ─── Geometry helpers ────────────────────────────────────── */

const EARTH_R = 6371;
function polylineKm(coords: [number, number][]): number {
  if (coords.length < 2) return 0;
  let km = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    km += 2 * EARTH_R * Math.asin(Math.sqrt(a));
  }
  return km;
}

/* ── mapbox-gl-draw style overrides matched to Kashmir palette ─── */

const SAFFRON = '#E8893A';
const DAL_BLUE = '#2A5266';

const drawStyles: any[] = [
  // Polygon fill (not used here, but the draw plugin requires basic polygon styles).
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Polygon']],
    paint: { 'fill-color': SAFFRON, 'fill-opacity': 0.12 },
  },
  {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: { 'line-color': SAFFRON, 'line-width': 2 },
  },
  // Trail line (LineString) — saffron, thick.
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': SAFFRON, 'line-width': 4 },
  },
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'LineString']],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': '#A65420', 'line-width': 5, 'line-dasharray': [0.2, 2] },
  },
  // Vertex / midpoint handles.
  {
    id: 'gl-draw-polygon-and-line-vertex-stroke-inactive',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-color': SAFFRON, 'circle-stroke-width': 2 },
  },
  // Standalone Point feature (waypoints / destinations).
  {
    id: 'gl-draw-point-inactive',
    type: 'circle',
    filter: ['all', ['==', 'active', 'false'], ['==', '$type', 'Point'], ['!=', 'meta', 'vertex']],
    paint: { 'circle-radius': 7, 'circle-color': DAL_BLUE, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
  },
  {
    id: 'gl-draw-point-active',
    type: 'circle',
    filter: ['all', ['==', 'active', 'true'], ['==', '$type', 'Point'], ['!=', 'meta', 'vertex']],
    paint: { 'circle-radius': 9, 'circle-color': SAFFRON, 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 },
  },
];
