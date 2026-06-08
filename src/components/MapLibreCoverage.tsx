/**
 * MapLibreCoverage — the 3D coverage view on a MapLibre canvas.
 *
 * Multi-destination overview rendered on a single 3D MapLibre canvas.
 * Useful for content teams to:
 *   - spot coverage gaps ("everything is in Pahalgam, nothing in Bandipore")
 *   - sanity-check trail polylines against real terrain
 *   - generate planning screenshots
 *
 * Supports two MapLibre-side terrain sources:
 *   • 'aws'     — AWS Open Terrain Tiles (terrarium). Free, no key. Default.
 *   • 'premium' — MapTiler terrain-rgb + outdoor style. Premium quality;
 *     needs NEXT_PUBLIC_MAPTILER_KEY.
 *
 * Kept here as its own component so the /map page can swap it for
 * <CesiumCoverage /> with a single state flip — the AWS terrain path
 * stays bit-for-bit unchanged from the original admin view.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { destinations, treks, apiGet } from '@/lib/api';
import { addContourLayers, setContourVisibility } from '@/lib/contours';
import { TERRAIN_SOURCES } from '@/lib/terrainSources';
import districtGeo from '@/data/jk-districts.json';

/** Esri World Imagery — free, no key. High-res aerial so terrain structure reads true. */
const SATELLITE_TILES = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];

/** First symbol (label) layer id — we insert raster layers beneath it so place labels stay on top. */
function firstSymbolLayerId(map: Map): string | undefined {
  return map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
}

export type LayerFilter = 'both' | 'destinations' | 'treks';

interface Props {
  /** Which MapLibre terrain source to use. The /map page also routes
   *  'cesium' to <CesiumCoverage />, so this component only ever sees
   *  'aws' or 'premium'. */
  terrain: 'aws' | 'premium';
  /** Basemap that the user picked on the page (shared with Cesium). */
  basemap: 'satellite' | 'map';
  /** Layer-filter state — owned by the page so the toggle survives
   *  switching between MapLibre and Cesium. */
  layers: LayerFilter;
}

export function MapLibreCoverage({ terrain, basemap, layers }: Props) {
  const destQ = useQuery({ queryKey: ['destinations-admin'], queryFn: destinations.list });
  const treksQ = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [contours, setContours] = useState(false);
  const [showDistricts, setShowDistricts] = useState(true);

  // Resolve the DEM config + base style for the current terrain source.
  // Falls back to AWS if someone wires 'premium' without a key.
  const sourceCfg: typeof TERRAIN_SOURCES.aws | typeof TERRAIN_SOURCES.premium =
    terrain === 'premium' && !TERRAIN_SOURCES.premium.needsKey
      ? TERRAIN_SOURCES.premium
      : TERRAIN_SOURCES.aws;

  const baseStyleUrl =
    terrain === 'premium' && sourceCfg.premiumBasemap?.styleUrl
      ? sourceCfg.premiumBasemap.styleUrl
      : 'https://tiles.openfreemap.org/styles/liberty';

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyleUrl,
      center: [74.7973, 34.0837],
      zoom: 8,
      pitch: 50,
      bearing: -18,
      maxPitch: 75,
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      const beforeId = firstSymbolLayerId(map);

      // Hide the basemap's own place names + road shields — they clutter the
      // view and multiply on zoom. We keep only our destination labels.
      for (const l of map.getStyle().layers ?? []) {
        if (l.type === 'symbol') map.setLayoutProperty(l.id, 'visibility', 'none');
      }

      map.addSource('terrain-dem', {
        type: 'raster-dem',
        tiles: sourceCfg.dem.tiles,
        tileSize: sourceCfg.dem.tileSize,
        encoding: sourceCfg.dem.encoding,
        maxzoom: sourceCfg.dem.maxzoom,
        attribution: sourceCfg.dem.attribution,
      });
      map.setTerrain({ source: 'terrain-dem', exaggeration: sourceCfg.dem.exaggeration });
      map.setSky({
        'sky-color':         '#a8d0f5',
        'sky-horizon-blend': 0.5,
        'horizon-color':     '#ffd9a0',
        'horizon-fog-blend': 0.5,
        'fog-color':         '#f5ebdc',
        'fog-ground-blend':  0.5,
      });

      // Satellite imagery drape — inserted beneath labels so place names stay readable.
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

      // Reuse the same DEM source for hillshade — saves a request.
      map.addLayer(
        {
          id: 'hillshade',
          type: 'hillshade',
          source: 'terrain-dem',
          paint: { 'hillshade-exaggeration': 0.35, 'hillshade-shadow-color': '#3D352A' },
        },
        beforeId,
      );

      // Contour lines (hidden until toggled on).
      addContourLayers(map, beforeId);

      // District boundaries (bundled J&K + Ladakh ADM2 polygons).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.addSource('districts', { type: 'geojson', data: districtGeo as any });
      map.addLayer({
        id: 'district-border',
        type: 'line',
        source: 'districts',
        layout: { 'line-join': 'round' },
        paint: {
          'line-color': '#E8893A',
          'line-width': 1.6,
          'line-opacity': 0.85,
          'line-dasharray': [3, 1.5],
        },
      }, beforeId);
      map.addLayer({
        id: 'district-label',
        type: 'symbol',
        source: 'districts',
        layout: {
          'text-field': ['get', 'district'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 12,
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.12,
          'symbol-placement': 'point',
        },
        paint: {
          'text-color': '#FBE7CE',
          'text-halo-color': '#3D2A14',
          'text-halo-width': 1.6,
        },
      }, beforeId);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Re-initialise when the terrain source changes — different DEM tiles,
    // different basemap style, both baked into the MapLibre style at
    // construction time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terrain]);

  /* ── Render destinations + treks as they arrive ─────────── */

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!destQ.data && !treksQ.data) return;

    const handle = () => {
      // Destinations as points
      const destFC = {
        type: 'FeatureCollection' as const,
        features: (destQ.data ?? []).map((d) => ({
          type: 'Feature' as const,
          properties: { id: d.id, name: d.name, slug: d.slug, featured: d.is_featured },
          geometry: { type: 'Point' as const, coordinates: [d.lng ?? 0, d.lat ?? 0] },
        })).filter((f) => f.geometry.coordinates[0] !== 0),
      };
      if (map.getSource('destinations')) {
        (map.getSource('destinations') as any).setData(destFC);
      } else {
        map.addSource('destinations', { type: 'geojson', data: destFC });
        map.addLayer({
          id: 'dest-pin',
          type: 'circle',
          source: 'destinations',
          paint: {
            'circle-radius': ['case', ['==', ['get', 'featured'], true], 9, 7],
            'circle-color': ['case', ['==', ['get', 'featured'], true], '#E8893A', '#2A5266'],
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        });
        map.addLayer({
          id: 'dest-label',
          type: 'symbol',
          source: 'destinations',
          // Label all our destinations (the basemap's own labels are hidden,
          // so these are the only titles on screen). Featured names win in
          // collisions; others fill in where there's room / on zoom.
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': ['case', ['==', ['get', 'featured'], true], 13, 11],
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-optional': true,
            'symbol-sort-key': ['case', ['==', ['get', 'featured'], true], 0, 1],
          },
          paint: {
            'text-color': '#1A1612',
            'text-halo-color': '#F5EBDC',
            'text-halo-width': 1.5,
          },
        });
        map.on('click', 'dest-pin', (e) => {
          const f = e.features?.[0];
          if (f) {
            new maplibregl.Popup()
              .setLngLat((f.geometry as any).coordinates)
              .setHTML(`<a href="/destinations/${f.properties?.id}" style="color: #2A5266; font-weight: 600;">${f.properties?.name}</a>`)
              .addTo(map);
          }
        });
      }

      // Treks — polylines (best-effort: fetch path for each on demand)
      (async () => {
        const trekFeatures: any[] = [];
        for (const t of treksQ.data ?? []) {
          try {
            const path = await apiGet<{ polyline: [number, number][] }>(`treks/${t.slug}/path`);
            if (path.polyline?.length >= 2) {
              trekFeatures.push({
                type: 'Feature',
                properties: { id: t.id, name: t.name, difficulty: t.difficulty },
                geometry: { type: 'LineString', coordinates: path.polyline },
              });
            }
          } catch { /* trek has no digitised path yet */ }
        }
        const trekFC = { type: 'FeatureCollection' as const, features: trekFeatures };
        if (map.getSource('treks')) {
          (map.getSource('treks') as any).setData(trekFC);
        } else {
          map.addSource('treks', { type: 'geojson', data: trekFC });
          map.addLayer({
            id: 'trek-line',
            type: 'line',
            source: 'treks',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': [
                'match',
                ['get', 'difficulty'],
                'easy',      '#2D6A4F',
                'moderate',  '#C9A227',
                'hard',      '#D97444',
                'strenuous', '#B23A2E',
                '#E8893A',
              ],
              'line-width': 3,
              'line-opacity': 0.85,
            },
          });
        }
      })();
    };

    if (map.isStyleLoaded()) handle();
    else map.once('load', handle);
  }, [destQ.data, treksQ.data]);

  /* ── Basemap toggle (satellite imagery ⇆ clean vector map) ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      if (!map.getLayer('satellite')) return;
      map.setLayoutProperty('satellite', 'visibility', basemap === 'satellite' ? 'visible' : 'none');
      // Strengthen hillshade on the bare vector map; soften it under imagery.
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

  /* ── District boundaries toggle ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const v = showDistricts ? 'visible' : 'none';
      for (const id of ['district-border', 'district-label']) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v);
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [showDistricts]);

  /* ── Layer filter (destinations / treks / both) ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const showDest = layers !== 'treks';
      const showTreks = layers !== 'destinations';
      const set = (id: string, on: boolean) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
      };
      set('dest-pin', showDest);
      set('dest-label', showDest);
      set('trek-line', showTreks);
    };
    if (map.isStyleLoaded()) apply();
    else map.once('idle', apply);
  }, [layers, destQ.data, treksQ.data]);

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      {/* Engine-specific toggles — live inside the MapLibre view so they
        *  disappear automatically when the user switches to Cesium. They
        *  sit below the page-level terrain / basemap pills (top-3 + top-12
        *  → top-[84px] is the third slot). */}
      <div className="absolute top-[84px] left-3 z-10 flex gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm">
        <button
          type="button"
          onClick={() => setContours((c) => !c)}
          className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition ${
            contours ? 'bg-kong text-white' : 'text-ink-3 hover:text-ink'
          }`}
          title="Toggle contour lines with elevation labels"
        >
          CONTOURS
        </button>
        <button
          type="button"
          onClick={() => setShowDistricts((d) => !d)}
          className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition ${
            showDistricts ? 'bg-kong text-white' : 'text-ink-3 hover:text-ink'
          }`}
          title="Toggle district boundaries"
        >
          DISTRICTS
        </button>
      </div>
    </>
  );
}
