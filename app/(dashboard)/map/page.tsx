/**
 * 3D map · Multi-destination overview.
 *
 * Drop every published destination + every trek polyline onto a single
 * 3D MapLibre canvas. Useful for content teams to:
 *   - spot coverage gaps ("everything is in Pahalgam, nothing in Bandipore")
 *   - sanity-check trail polylines against real terrain
 *   - generate planning screenshots
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PageHeader } from '@/components/PageHeader';
import { destinations, treks, apiGet } from '@/lib/api';
import { addContourLayers, setContourVisibility } from '@/lib/contours';
import districtGeo from '@/data/jk-districts.json';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];
/** Esri World Imagery — free, no key. High-res aerial so terrain structure reads true. */
const SATELLITE_TILES = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];

/** First symbol (label) layer id — we insert raster layers beneath it so place labels stay on top. */
function firstSymbolLayerId(map: Map): string | undefined {
  return map.getStyle().layers?.find((l) => l.type === 'symbol')?.id;
}

export default function MapPage() {
  const destQ = useQuery({ queryKey: ['destinations-admin'], queryFn: destinations.list });
  const treksQ = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [basemap, setBasemap] = useState<'satellite' | 'map'>('satellite');
  const [contours, setContours] = useState(false);
  const [layers, setLayers] = useState<'both' | 'destinations' | 'treks'>('both');
  const [showDistricts, setShowDistricts] = useState(true);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
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

      map.addSource('aws-dem', {
        type: 'raster-dem',
        tiles: DEM_TILES,
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
      });
      map.setTerrain({ source: 'aws-dem', exaggeration: 1.4 });
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

      map.addSource('hillshade-src', {
        type: 'raster-dem',
        tiles: DEM_TILES,
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 15,
      });
      map.addLayer(
        {
          id: 'hillshade',
          type: 'hillshade',
          source: 'hillshade-src',
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
  }, []);

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

  const destCount = destQ.data?.length ?? 0;
  const trekCount = treksQ.data?.length ?? 0;

  return (
    <>
      <PageHeader
        title="3D map · Coverage view"
        subtitle={`${destCount} destinations · ${trekCount} treks · MapLibre + AWS Terrain`}
      />
      <div className="p-8">
        <div
          className="relative rounded-card border border-line overflow-hidden bg-pashmina"
          style={{ height: 'calc(100vh - 220px)', minHeight: 540 }}
        >
          <div ref={containerRef} className="h-full w-full" />
          {/* Basemap toggle */}
          <div className="absolute top-3 left-3 z-10 flex gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm">
            {(['satellite', 'map'] as const).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBasemap(b)}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition ${
                  basemap === b ? 'bg-kong text-white' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {b === 'satellite' ? 'SATELLITE' : 'MAP'}
              </button>
            ))}
            <div className="w-px bg-line mx-0.5 self-stretch" />
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

          {/* Layer filter tabs */}
          <div className="absolute top-3 right-3 z-10 flex gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm">
            {([
              ['both', 'BOTH'],
              ['destinations', 'DESTINATIONS'],
              ['treks', 'TREKS'],
            ] as const).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setLayers(val)}
                className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition ${
                  layers === val ? 'bg-kong text-white' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-ink-3 font-mono tracking-wider mt-2 leading-relaxed">
          · CIRCLES: DESTINATIONS · LINES: TREKS (COLORED BY DIFFICULTY) · ORANGE: FEATURED · IMAGERY: ESRI · MAP: OPENFREEMAP · DEM: AWS OPEN TERRAIN TILES
        </p>
      </div>
    </>
  );
}
