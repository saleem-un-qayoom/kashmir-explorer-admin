/**
 * GPXUploader — drop a .gpx file to populate the trail.
 *
 * Parses GPX 1.0 / 1.1 in the browser (DOMParser, no library):
 *  - `<trk><trkseg><trkpt lat lon>` → polyline as [[lng, lat], …]
 *  - `<wpt lat lon><name><ele><type>` → waypoint objects
 *
 * Emits both, plus a derived bounding box for the parent to fit the map.
 * Accepts files dropped on the box or via the click-to-pick fallback.
 */
'use client';

import { useRef, useState, type DragEvent } from 'react';
import { UploadSimple, Path as PathIcon, X } from '@phosphor-icons/react';

export interface ParsedWaypoint {
  lat: number;
  lng: number;
  name: string;
  type: 'camp' | 'summit' | 'lake' | 'pass' | 'start' | 'end';
  altitudeM: number;
  notes?: string;
}

export interface ParsedPhase {
  day: number;
  coordinates: [number, number][];
}

export interface ParsedGPX {
  polyline: [number, number][];        // [[lng, lat], …] — entire route flattened
  /** One phase per <trkseg> (or per <trk> if a file has multiple tracks). */
  phases: ParsedPhase[];
  waypoints: ParsedWaypoint[];
  /** [minLng, minLat, maxLng, maxLat]. Useful for fitBounds. */
  bbox?: [number, number, number, number];
  trackName?: string;
}

interface Props {
  onParsed: (gpx: ParsedGPX) => void;
}

/* ─── Parser ──────────────────────────────────────────────── */

function inferType(name: string): ParsedWaypoint['type'] {
  const n = name.toLowerCase();
  if (n.includes('start') || n.includes('trailhead')) return 'start';
  if (n.includes('end')   || n.includes('finish'))    return 'end';
  if (n.includes('summit')|| n.includes('peak'))      return 'summit';
  if (n.includes('lake')  || n.includes('sar'))       return 'lake';
  if (n.includes('pass')) return 'pass';
  return 'camp';
}

function parseGPX(xml: string): ParsedGPX {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const err = doc.querySelector('parsererror');
  if (err) throw new Error('GPX file is not valid XML.');

  /* Polyline + phases
   *
   * Each <trkseg> (or each <trk> if a file has one seg per track) becomes
   * a day. Multi-day Komoot exports and Garmin "saved courses" both
   * follow this convention. If the file is a route (<rte>), we treat it
   * as a single day. */
  const phases: ParsedPhase[] = [];
  const trksegs = Array.from(doc.querySelectorAll('trk > trkseg'));
  if (trksegs.length) {
    let dayCounter = 1;
    for (const seg of trksegs) {
      const coords: [number, number][] = Array.from(seg.querySelectorAll('trkpt')).map((p) => [
        parseFloat(p.getAttribute('lon') ?? '0'),
        parseFloat(p.getAttribute('lat') ?? '0'),
      ]);
      if (coords.length >= 2) phases.push({ day: dayCounter++, coordinates: coords });
    }
  }
  if (!phases.length) {
    // Route fallback
    const rtepts: [number, number][] = Array.from(doc.querySelectorAll('rte > rtept')).map((p) => [
      parseFloat(p.getAttribute('lon') ?? '0'),
      parseFloat(p.getAttribute('lat') ?? '0'),
    ]);
    if (rtepts.length >= 2) phases.push({ day: 1, coordinates: rtepts });
  }
  if (!phases.length) throw new Error('No track points found in this GPX.');

  // Flat polyline for legacy single-day consumers.
  const polyline: [number, number][] = phases.flatMap((p) => p.coordinates);

  // Waypoints from <wpt>
  const wpts = Array.from(doc.querySelectorAll('wpt'));
  const waypoints: ParsedWaypoint[] = wpts.map((w) => {
    const lat = parseFloat(w.getAttribute('lat') ?? '0');
    const lng = parseFloat(w.getAttribute('lon') ?? '0');
    const name = w.querySelector('name')?.textContent?.trim() ?? '';
    const ele  = parseFloat(w.querySelector('ele')?.textContent ?? '0') || 0;
    const typeText = w.querySelector('type')?.textContent?.trim()?.toLowerCase() ?? '';
    const cmt  = w.querySelector('cmt')?.textContent?.trim() || undefined;
    const type: ParsedWaypoint['type'] =
      (['camp','summit','lake','pass','start','end'] as const).includes(typeText as any)
        ? (typeText as ParsedWaypoint['type'])
        : inferType(name);
    return { lat, lng, name, type, altitudeM: Math.round(ele), notes: cmt };
  });

  // Bounding box across both
  let minLng =  Infinity, minLat =  Infinity;
  let maxLng = -Infinity, maxLat = -Infinity;
  const eat = (lng: number, lat: number) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };
  polyline.forEach(([lng, lat]) => eat(lng, lat));
  waypoints.forEach((w) => eat(w.lng, w.lat));
  const bbox: ParsedGPX['bbox'] =
    isFinite(minLng) ? [minLng, minLat, maxLng, maxLat] : undefined;

  const trackName =
    doc.querySelector('trk > name')?.textContent?.trim()
    ?? doc.querySelector('metadata > name')?.textContent?.trim()
    ?? undefined;

  return { polyline, phases, waypoints, bbox, trackName };
}

/* ─── Component ───────────────────────────────────────────── */

export function GPXUploader({ onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);
  const [busy, setBusy]   = useState(false);
  const [preview, setPreview] = useState<ParsedGPX | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File) => {
    setError(null);
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseGPX(text);
      if (!parsed.polyline.length && !parsed.waypoints.length) {
        throw new Error('Nothing to import — no track points or waypoints.');
      }
      setPreview(parsed);
      onParsed(parsed);
    } catch (e: any) {
      setError(e?.message ?? 'Could not parse GPX file.');
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handle(f);
  };

  return (
    <div className="space-y-2">
      <div
        className={`border-2 border-dashed rounded-btn p-5 text-center cursor-pointer transition select-none ${
          hover ? 'border-dal bg-dal/10' : 'border-line hover:border-dal/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setHover(true); }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <UploadSimple size={22} weight="duotone" className="inline mb-2 text-ink-2" />
        <div className="text-sm text-ink">
          {busy ? 'Parsing…' : 'Drop a .gpx file here'}
          <span className="text-ink-3"> · or click to browse</span>
        </div>
        <div className="text-[10px] text-ink-3 font-mono tracking-wider mt-1">
          ACCEPTS GPX 1.0 / 1.1 — TRACKS, ROUTES, AND WAYPOINTS
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".gpx,application/gpx+xml,application/xml,text/xml"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handle(f);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="text-xs text-chinar bg-chinar/5 border border-chinar/30 rounded-btn p-2">
          {error}
        </div>
      )}

      {preview && (
        <div className="card p-3 flex items-center gap-4">
          <PathIcon size={20} weight="duotone" className="text-kong" />
          <div className="flex-1 text-xs space-y-0.5">
            {preview.trackName && (
              <div className="font-medium text-ink">{preview.trackName}</div>
            )}
            <div className="text-ink-2 font-mono tracking-wider text-[11px]">
              {preview.polyline.length.toLocaleString()} TRKPTS · {preview.phases.length} {preview.phases.length === 1 ? 'PHASE' : 'PHASES'} · {preview.waypoints.length} WPTS
            </div>
            {preview.bbox && (
              <div className="text-ink-3 font-mono text-[10px] tracking-wider">
                BBOX {preview.bbox[1].toFixed(3)}°N {preview.bbox[0].toFixed(3)}°E → {preview.bbox[3].toFixed(3)}°N {preview.bbox[2].toFixed(3)}°E
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPreview(null)}
            className="text-ink-3 hover:text-chinar transition"
            title="Dismiss preview (data already applied)"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
