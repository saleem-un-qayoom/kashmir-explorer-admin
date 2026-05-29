'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Props {
  /** Centre + marker position. If null, uses default Kashmir. */
  lat?: number | null;
  lng?: number | null;
  /** Callback when marker is dragged. If omitted, marker is read-only. */
  onMove?: (lat: number, lng: number) => void;
  /** Trail polyline coordinates [[lat, lng], ...] */
  trail?: [number, number][];
  /** Height in px */
  height?: number;
}

// Fix Leaflet's broken default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const KASHMIR_CENTER: [number, number] = [34.0, 74.8];

export function MapView({ lat, lng, onMove, trail, height = 300 }: Props) {
  const id = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const [terrain3d, setTerrain3d] = useState(false);

  const hasLocation = lat != null && lng != null;

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(id.current, {
      center: hasLocation ? [lat!, lng!] : KASHMIR_CENTER,
      zoom: hasLocation ? 11 : 8,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Hillshading overlay for pseudo-3D terrain
    if (terrain3d) {
      L.tileLayer('https://tiles.openseamap.org/hillshading/{z}/{x}/{y}.png', {
        maxZoom: 15,
        opacity: 0.4,
      }).addTo(map);
    }

    // Zoom controls
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapRef.current = map;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    const pos: [number, number] = hasLocation ? [lat!, lng!] : KASHMIR_CENTER;
    const marker = L.marker(pos, {
      draggable: !!onMove,
    }).addTo(map);

    if (onMove) {
      marker.on('dragend', () => {
        const p = marker.getLatLng();
        onMove(p.lat, p.lng);
      });
    }

    markerRef.current = marker;
  }, [lat, lng, onMove]);

  // Trail
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (trailRef.current) {
      trailRef.current.remove();
      trailRef.current = null;
    }

    if (trail && trail.length > 0) {
      const pl = L.polyline(trail, {
        color: '#B23A2E',
        weight: 3,
        opacity: 0.8,
      }).addTo(map);
      map.fitBounds(pl.getBounds().pad(0.2));
      trailRef.current = pl;
    }
  }, [trail]);

  return (
    <div className="relative">
      <div
        id={id.current}
        style={{ height, width: '100%' }}
        className="rounded-btn border border-line overflow-hidden"
      />
      {!hasLocation && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-[999] pointer-events-none">
          <span className="text-sm text-ink-2 font-quote italic">Save to enable map</span>
        </div>
      )}
      <div className="absolute top-2 right-2 z-[1000] flex gap-1">
        <button
          className={`text-xs px-2 py-1 rounded font-medium border transition ${
            terrain3d ? 'bg-dal text-white border-dal' : 'bg-white text-ink-2 border-line'
          }`}
          onClick={() => setTerrain3d((v) => !v)}
        >
          3D
        </button>
      </div>
    </div>
  );
}
