'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Props {
  /** Initial polyline as [lng, lat][]. Mutated via onChange. */
  polyline: [number, number][];
  onChange: (polyline: [number, number][], coords: { lng: number; lat: number }[]) => void;
  height?: number;
}

export function TrailEditor({ polyline, onChange, height = 350 }: Props) {
  const id = useRef(`trail-${Math.random().toString(36).slice(2)}`);
  const mapRef = useRef<L.Map | null>(null);
  const polylineLayer = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [pts, setPts] = useState<[number, number][]>(polyline);

  // Sync initial polyline
  useEffect(() => { setPts(polyline); }, [polyline]);

  // Init map
  useEffect(() => {
    if (mapRef.current) return;
    const map = L.map(id.current, {
      center: pts.length > 0 ? [pts[0][1], pts[0][0]] : [34.0, 74.8],
      zoom: pts.length > 0 ? 12 : 8,
      zoomControl: false,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPt: [number, number] = [e.latlng.lng, e.latlng.lat];
      const next = [...pts, newPt];
      setPts(next);
      updateLayers(map, next, markersRef, polylineLayer);
      onChange(next, next.map((p) => ({ lng: p[0], lat: p[1] })));
    });

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Rebuild layers when pts change externally
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    updateLayers(map, pts, markersRef, polylineLayer);
  }, [pts]);

  const removePoint = useCallback((idx: number) => {
    const next = pts.filter((_, i) => i !== idx);
    setPts(next);
    if (mapRef.current) {
      updateLayers(mapRef.current, next, markersRef, polylineLayer);
      onChange(next, next.map((p) => ({ lng: p[0], lat: p[1] })));
    }
  }, [pts, onChange]);

  const movePoint = useCallback((idx: number, dir: -1 | 1) => {
    const next = [...pts];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPts(next);
    if (mapRef.current) {
      updateLayers(mapRef.current, next, markersRef, polylineLayer);
      onChange(next, next.map((p) => ({ lng: p[0], lat: p[1] })));
    }
  }, [pts, onChange]);

  const clearAll = useCallback(() => {
    setPts([]);
    if (mapRef.current) {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      polylineLayer.current?.remove();
      polylineLayer.current = null;
    }
    onChange([], []);
  }, [onChange]);

  return (
    <div>
      <div
        id={id.current}
        style={{ height, width: '100%' }}
        className="rounded-btn border border-line overflow-hidden"
      />
      {pts.length > 0 && (
        <div className="mt-2 space-y-1 max-h-[200px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-ink-3 font-mono">{pts.length} points</span>
            <button className="text-[10px] text-chinar font-medium hover:underline" onClick={clearAll}>Clear all</button>
          </div>
          {pts.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs font-mono bg-pashmina/20 px-2 py-1 rounded">
              <span className="text-ink-3 w-5 text-right">{i + 1}.</span>
              <span className="text-ink-1 flex-1">{p[1].toFixed(4)}, {p[0].toFixed(4)}</span>
              <button className="text-ink-3 hover:text-dal disabled:opacity-30" onClick={() => movePoint(i, -1)} disabled={i === 0}>↑</button>
              <button className="text-ink-3 hover:text-dal disabled:opacity-30" onClick={() => movePoint(i, 1)} disabled={i === pts.length - 1}>↓</button>
              <button className="text-chinar hover:text-red-700" onClick={() => removePoint(i)}>✕</button>
            </div>
          ))}
        </div>
      )}
      {pts.length === 0 && (
        <p className="text-[11px] text-ink-3 mt-1 font-quote italic">Click on the map to add trail points</p>
      )}
    </div>
  );
}

function updateLayers(
  map: L.Map,
  pts: [number, number][],
  markersRef: React.MutableRefObject<L.Marker[]>,
  polylineRef: React.MutableRefObject<L.Polyline | null>,
) {
  // Clear old
  markersRef.current.forEach((m) => m.remove());
  markersRef.current = [];
  polylineRef.current?.remove();
  polylineRef.current = null;

  if (pts.length === 0) return;

  // Polyline
  const latlngs = pts.map((p) => [p[1], p[0]] as [number, number]);
  polylineRef.current = L.polyline(latlngs, {
    color: '#B23A2E',
    weight: 3,
    opacity: 0.8,
  }).addTo(map);

  // Markers
  pts.forEach((p, i) => {
    const m = L.marker([p[1], p[0]], {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: `<div style="background:#B23A2E;color:#fff;width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.3)">${i + 1}</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(map);

    m.on('dragend', () => {
      const ll = m.getLatLng();
      pts[i] = [ll.lng, ll.lat];
      // Rebuild polyline
      polylineRef.current?.setLatLngs(pts.map((pp) => [pp[1], pp[0]] as [number, number]));
    });

    markersRef.current.push(m);
  });

  map.fitBounds(polylineRef.current.getBounds().pad(0.2));
}
