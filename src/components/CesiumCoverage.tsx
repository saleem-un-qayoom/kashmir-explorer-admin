/**
 * CesiumCoverage — the same 3D coverage view rendered on a Cesium globe with
 * Cesium World Terrain.
 *
 * Drop-in replacement for <MapLibreCoverage /> when the user flips the
 * terrain toggle to "Cesium" on the /map page. Identical data shape:
 *   • destination pins (lat/lng + name + featured flag)
 *   • trek polylines (one phase per trek, color-cycled)
 *
 * Read-only — no Mapbox-Draw equivalent in Cesium. The MapLibre view is the
 * editing surface; this is the review / screenshot surface.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { destinations, treks, apiGet } from '@/lib/api';
import type { CesiumPin, CesiumPhase } from './CesiumViewer';

/** Day-color cycle — matches Map3DEditor's palette (and the MapLibre view's
 *  day-by-day styling). Reused here so a single trek per "day" gives a
 *  varied palette without us having to invent one. */
const DAY_COLORS = [
  '#E8893A', // saffron
  '#2A5266', // dal
  '#2D6A4F', // emerald
  '#B23A2E', // chinar
  '#1F4788', // sapphire
  '#C9A227', // mustard
];

// Cesium ships ~5 MB of WebGL code and reads `window` at import time. We
// dynamic-import it with ssr:false so it never touches the server.
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

interface Props {
  basemap: 'satellite' | 'map';
}

export function CesiumCoverage({ basemap }: Props) {
  const destQ = useQuery({ queryKey: ['destinations-admin'], queryFn: destinations.list });
  const treksQ = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });

  // Trek polylines are fetched on demand from the API (same as MapLibre view).
  // We accumulate them in state as they resolve, so the Cesium entity list
  // grows as paths arrive.
  const [phases, setPhases] = useState<CesiumPhase[]>([]);

  useEffect(() => {
    if (!treksQ.data) return;
    let cancelled = false;
    (async () => {
      const out: CesiumPhase[] = [];
      for (let i = 0; i < treksQ.data.length; i++) {
        const t = treksQ.data[i];
        try {
          const path = await apiGet<{ polyline: [number, number][] }>(`treks/${t.slug}/path`);
          if (path.polyline?.length >= 2) {
            // One phase per trek; day = i+1 so the dayColor cycle paints
            // each trek differently.
            out.push({ day: (i % DAY_COLORS.length) + 1, coordinates: path.polyline });
          }
        } catch { /* trek has no digitised path yet */ }
      }
      if (!cancelled) setPhases(out);
    })();
    return () => { cancelled = true; };
  }, [treksQ.data]);

  const pins: CesiumPin[] = (destQ.data ?? [])
    .filter((d) => d.lng != null && d.lat != null && (d.lng !== 0 || d.lat !== 0))
    .map((d) => ({
      id: d.id,
      lng: d.lng as number,
      lat: d.lat as number,
      label: d.is_featured ? d.name : undefined,
    }));

  return (
    <CesiumViewer
      points={pins}
      phases={phases}
      basemap={basemap}
      height="100%"
    />
  );
}
