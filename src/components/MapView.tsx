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
  lat?: number | null;
  lng?: number | null;
  onMove?: (lat: number, lng: number) => void;
  trail?: [number, number][];
  height?: number;
  /** Optional place name shown/edited in the fields below the map. */
  name?: string;
  onNameChange?: (name: string) => void;
  /** Show editable Name / Lat / Lng fields under the map (defaults to true when onMove is set). */
  showFields?: boolean;
}

const KASHMIR_CENTER: [number, number] = [34.0, 74.8];
const DEFAULT_ZOOM = 11;

// Kashmir region boundaries (approximate)
const KASHMIR_BOUNDS: [[number, number], [number, number]] = [
  [32.8, 73.0],  // Southwest
  [37.5, 77.8],  // Northeast
];

interface GeocodingResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export function MapView({ lat, lng, onMove, trail, height = 300, name, onNameChange, showFields }: Props) {
  const id = useRef(`map-${Math.random().toString(36).slice(2)}`);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const trailRef = useRef<L.Polyline | null>(null);
  const hillRef = useRef<L.TileLayer | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchRef = useRef<HTMLDivElement>(null);

  const hasLocation = lat != null && lng != null;

  const [terrain3d, setTerrain3d] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [coordDisplay, setCoordDisplay] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleZoom = useCallback(() => {
    setZoom(mapRef.current?.getZoom() ?? DEFAULT_ZOOM);
  }, []);

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (!onMove) return;
    onMove(e.latlng.lat, e.latlng.lng);
  }, [onMove]);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(id.current, {
      center: hasLocation ? [lat!, lng!] : KASHMIR_CENTER,
      zoom: hasLocation ? 13 : DEFAULT_ZOOM,
      zoomControl: false,
      maxBounds: KASHMIR_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 9,
      maxZoom: 16,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
      bounds: KASHMIR_BOUNDS,
      maxNativeZoom: 19,
    }).addTo(map);

    // Add Kashmir boundary visualization
    L.rectangle(KASHMIR_BOUNDS, {
      color: '#1F9D57',
      weight: 2.5,
      opacity: 0.7,
      fill: true,
      fillColor: '#1F9D57',
      fillOpacity: 0.05,
      dashArray: '6, 4',
      lineCap: 'round',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.scale({ position: 'bottomleft', metric: true, imperial: false }).addTo(map);

    map.on('zoomend', handleZoom);
    map.on('click', handleMapClick);
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCoordDisplay(`${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`);
    });

    mapRef.current = map;
    setZoom(map.getZoom());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.off('click', handleMapClick);
    map.on('click', handleMapClick);
  }, [handleMapClick]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (hillRef.current) {
      map.removeLayer(hillRef.current);
      hillRef.current = null;
    }

    if (terrain3d) {
      hillRef.current = L.tileLayer('https://tiles.openseamap.org/hillshading/{z}/{x}/{y}.png', {
        maxZoom: 15,
        opacity: 0.4,
      }).addTo(map);
    }
  }, [terrain3d]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Only render a marker once an actual location exists — no default pin.
    if (!hasLocation) return;

    const m = L.marker([lat!, lng!], { draggable: !!onMove }).addTo(map);

    if (onMove) {
      m.on('dragend', () => {
        const p = m.getLatLng();
        onMove(p.lat, p.lng);
      });
    }

    markerRef.current = m;
  }, [lat, lng, onMove]);

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

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (!value || value.length < 3) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&countrycodes=in`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: GeocodingResult[] = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const selectResult = (r: GeocodingResult) => {
    const slat = parseFloat(r.lat);
    const slng = parseFloat(r.lon);
    const placeName = r.display_name.split(',')[0];
    setSearchQuery(placeName);
    setShowResults(false);

    if (onMove) onMove(slat, slng);
    if (onNameChange) onNameChange(placeName);
    mapRef.current?.flyTo([slat, slng], 14);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFullscreen = () => {
    setFullscreen((v) => !v);
    setTimeout(() => mapRef.current?.invalidateSize(), 150);
  };

  const fieldsVisible = (showFields ?? !!onMove) && !fullscreen;

  return (
    <div className={fullscreen ? 'fixed inset-0 z-[9999] bg-white p-4' : ''}>
    <div className="relative">
      <div ref={searchRef} className="absolute top-3 left-3 z-[1000] w-[280px]">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            placeholder="Search places…"
            className="w-full input text-xs h-9 pl-7 transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong"
          />
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-600 dark:text-slate-400 pointer-events-none font-semibold">🔍</span>
          {searching && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-ink-3 animate-pulse">…</span>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-[220px] overflow-y-auto z-50">
              {searchResults.map((r) => (
                <button
                  key={r.place_id}
                  className="w-full text-left px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-kong/10 dark:hover:bg-kong/15 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors duration-150"
                  onClick={() => selectResult(r)}
                >
                  <span className="block truncate font-medium">{r.display_name}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block font-mono">
                    {r.lat.slice(0, 7)}, {r.lon.slice(0, 7)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        id={id.current}
        style={{ height: fullscreen ? 'calc(100vh - 32px)' : height, width: '100%' }}
        className={`rounded-btn border border-line overflow-hidden ${onMove ? 'cursor-crosshair' : ''}`}
      />

      <div className="absolute bottom-3 left-3 z-[1000] flex gap-1.5">
        <div className="bg-white/90 backdrop-blur text-[10px] font-mono text-ink-2 px-2 py-1 rounded border border-line/50 shadow-sm">
          {coordDisplay || (hasLocation ? `${lat!.toFixed(4)}, ${lng!.toFixed(4)}` : '—')}
        </div>
        <div className="bg-white/90 backdrop-blur text-[10px] font-mono text-ink-3 px-2 py-1 rounded border border-line/50 shadow-sm">
          Z{zoom}
        </div>
      </div>

      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button
          className={`text-xs px-3 py-1.5 rounded font-semibold border transition-all duration-200 ${
            terrain3d ? 'bg-kong text-white border-kong shadow-md hover:shadow-lg hover:bg-kong-deep' : 'bg-white/90 backdrop-blur text-slate-700 border-slate-200 hover:border-kong/50 hover:shadow-md'
          }`}
          onClick={() => setTerrain3d((v) => !v)}
          title={terrain3d ? 'Hide terrain' : 'Show terrain'}
        >
          3D
        </button>
        <button
          className="text-xs px-3 py-1.5 rounded font-semibold border bg-white/90 backdrop-blur text-slate-700 border-slate-200 hover:border-kong/50 hover:shadow-md transition-all duration-200 leading-none"
          onClick={toggleFullscreen}
          title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {fullscreen ? '✕' : '⛶'}
        </button>
      </div>

      {!hasLocation && !onMove && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 z-[999] pointer-events-none rounded-btn">
          <span className="text-sm text-ink-2 font-quote italic">No location set</span>
        </div>
      )}
      </div>

      {fieldsVisible && (
        <div className="mt-4">
          <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3 font-medium">
            Search, click the map, or drag the pin — fields below update automatically.
          </p>
          <div className={`grid gap-4 ${onNameChange ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {onNameChange && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Name</span>
                <input
                  type="text"
                  value={name ?? ''}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder="Place name"
                  className="input text-xs h-9 transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Latitude</span>
              <input
                type="number"
                step="0.0001"
                value={lat ?? ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) onMove?.(v, lng ?? KASHMIR_CENTER[1]);
                }}
                placeholder="34.0000"
                className="input text-xs h-9 font-mono transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Longitude</span>
              <input
                type="number"
                step="0.0001"
                value={lng ?? ''}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  if (!Number.isNaN(v)) onMove?.(lat ?? KASHMIR_CENTER[0], v);
                }}
                placeholder="74.8000"
                className="input text-xs h-9 font-mono transition-all duration-200 focus:ring-2 focus:ring-kong/40 focus:border-kong dark:focus:ring-kong/40 dark:focus:border-kong"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
