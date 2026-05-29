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
import { useEffect, useRef } from 'react';
import maplibregl, { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PageHeader } from '@/components/PageHeader';
import { destinations, treks, apiGet } from '@/lib/api';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const DEM_TILES = ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];

export default function MapPage() {
  const destQ = useQuery({ queryKey: ['destinations-admin'], queryFn: destinations.list });
  const treksQ = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);

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
      map.addSource('aws-dem', {
        type: 'raster-dem',
        tiles: DEM_TILES,
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 13,
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
      map.addSource('hillshade-src', {
        type: 'raster-dem',
        tiles: DEM_TILES,
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 13,
      });
      map.addLayer({
        id: 'hillshade',
        type: 'hillshade',
        source: 'hillshade-src',
        paint: { 'hillshade-exaggeration': 0.5, 'hillshade-shadow-color': '#3D352A' },
      });
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
          layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Regular'],
            'text-size': 11,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
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
          ref={containerRef}
          className="rounded-card border border-line overflow-hidden bg-pashmina"
          style={{ height: 'calc(100vh - 220px)', minHeight: 540 }}
        />
        <p className="text-[10px] text-ink-3 font-mono tracking-wider mt-2 leading-relaxed">
          · CIRCLES: DESTINATIONS · LINES: TREKS (COLORED BY DIFFICULTY) · ORANGE: FEATURED · TILES: OPENFREEMAP · DEM: AWS OPEN TERRAIN TILES
        </p>
      </div>
    </>
  );
}
