/**
 * 3D map · Multi-destination overview.
 *
 * This page is a thin shell that owns the shared map controls (basemap,
 * layer filter, contour / district toggles) and routes between three
 * renderers based on the terrain toggle:
 *
 *   • <MapLibreCoverage terrain="aws" />     — OpenFreeMap vector basemap
 *     + AWS Terrarium DEM. 3D relief via MapLibre's setTerrain. Original
 *     admin view, free, no key.
 *
 *   • <MapLibreCoverage terrain="premium" /> — MapTiler outdoor vector
 *     style + MapTiler terrain-rgb DEM. Premium quality; needs
 *     NEXT_PUBLIC_MAPTILER_KEY.
 *
 *   • <CesiumCoverage /> — Cesium globe with Cesium World Terrain
 *     (Cesium ion asset 1) + Bing Aerial imagery. Read-only — the
 *     editing tools are MapLibre-only.
 *
 * The terrain toggle is a row of pill buttons in the top-left corner.
 * Switching is instant: the off-engine component is fully unmounted,
 * the on-engine one mounts fresh, and the shared controls (basemap,
 * layer filter) carry over so the user doesn't lose their selection.
 */
'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { destinations, treks } from '@/lib/api';
import type { LayerFilter } from '@/components/MapLibreCoverage';
import { TERRAIN_SOURCES, getAvailableTerrainSources } from '@/lib/terrainSources';

// CesiumCoverage is dynamic-imported with ssr:false at the call site
// (Cesium touches `window` at import time).
const MapLibreCoverage = dynamic(
  () => import('@/components/MapLibreCoverage').then((m) => m.MapLibreCoverage),
  { ssr: false, loading: () => <MapShellLoading label="Loading map…" /> },
);
const CesiumCoverage = dynamic(
  () => import('@/components/CesiumCoverage').then((m) => m.CesiumCoverage),
  { ssr: false, loading: () => <MapShellLoading label="Loading Cesium globe…" /> },
);

function MapShellLoading({ label }: { label: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-pashmina">
      <span className="text-xs font-mono text-ink-3 animate-pulse">{label}</span>
    </div>
  );
}

type Terrain = 'aws' | 'premium' | 'cesium';

export default function MapPage() {
  const destQ = useQuery({ queryKey: ['destinations-admin'], queryFn: destinations.list });
  const treksQ = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });

  // Shared state — survives switching between engines.
  const [terrain, setTerrain] = useState<Terrain>('aws');
  const [basemap, setBasemap] = useState<'satellite' | 'map'>('satellite');
  const [layers, setLayers] = useState<LayerFilter>('both');

  // Sources whose required key is actually configured. The toggle
  // buttons render only these — Premium is hidden entirely when
  // NEXT_PUBLIC_MAPTILER_KEY is unset, so users never see a
  // "click → setup hint" dead end.
  const availableTerrains = getAvailableTerrainSources();

  // Effective terrain: clamps the saved state to the currently-available
  // sources. If the env var disappears (or page mounts with stale state)
  // we fall back to 'aws' silently rather than rendering broken.
  const effectiveTerrain = availableTerrains.includes(terrain) ? terrain : 'aws';

  const destCount = destQ.data?.length ?? 0;
  const trekCount = treksQ.data?.length ?? 0;

  const terrainSubtitle =
    effectiveTerrain === 'aws'  ? 'AWS Open Terrain Tiles (terrarium)'
    : effectiveTerrain === 'premium' ? 'MapTiler terrain-rgb + outdoor style'
                             : 'Cesium World Terrain · ion asset 1';

  return (
    <>
      <PageHeader
        title="3D map · Coverage view"
        subtitle={`${destCount} destinations · ${trekCount} treks · ${terrainSubtitle} · default: AWS (free, no key)`}
      />
      <div className="p-8">
        <div
          className="relative rounded-card border border-line overflow-hidden bg-pashmina"
          style={{ height: 'calc(100vh - 220px)', minHeight: 540 }}
        >
          {effectiveTerrain === 'cesium' ? (
            <CesiumCoverage basemap={basemap} />
          ) : (
            <MapLibreCoverage
              terrain={effectiveTerrain}
              basemap={basemap}
              layers={layers}
            />
          )}

          {/* Terrain source toggle (top-left) — only shows options that
           *  are actually usable. AWS is always shown (free, no key, no
           *  quota). Premium is hidden entirely when
           *  NEXT_PUBLIC_MAPTILER_KEY is unset, so the toggle is never
           *  "click → setup hint" dead end. */}
          <div className="absolute top-3 left-3 z-10 flex gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm">
            {availableTerrains.map((t) => {
              const cfg = TERRAIN_SOURCES[t];
              const isActive = effectiveTerrain === t;
              const isAws = t === 'aws';
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTerrain(t)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition flex items-center gap-1 ${
                    isActive ? 'bg-dal text-white' : 'text-ink-3 hover:text-ink'
                  }`}
                  title={cfg.hint}
                >
                  {cfg.id === 'aws'      ? 'AWS TERRAIN'
                   : cfg.id === 'premium' ? 'PREMIUM'
                                          : 'CESIUM WORLD'}
                  {isAws && !isActive && (
                    <span className="text-emerald" title="Default — free, no key">●</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Basemap toggle (top-left, below terrain) — only the basemap
           *  labels live here; the engine-specific toggles
           *  (CONTOURS / DISTRICTS for MapLibre) live inside the engine
           *  component for now. */}
          <div className="absolute top-12 left-3 z-10 flex gap-0.5 p-0.5 bg-white/95 backdrop-blur rounded-btn border border-line shadow-warm">
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
          </div>

          {/* Layer filter tabs (top-right) */}
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
          · CIRCLES: DESTINATIONS · LINES: TREKS · ORANGE: FEATURED ·
          {terrain === 'aws'      && ' IMAGERY: ESRI · MAP: OPENFREEMAP · DEM: AWS OPEN TERRAIN TILES'}
          {terrain === 'premium'  && ' IMAGERY: ESRI · MAP: MAPTILER OUTDOOR · DEM: MAPTILER TERRAIN-RGB'}
          {terrain === 'cesium'   && ' IMAGERY: BING AERIAL · TERRAIN: CESIUM WORLD TERRAIN (ION)'}
        </p>
      </div>
    </>
  );
}
