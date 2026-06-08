/**
 * CesiumViewer — read-only 3D globe with Cesium World Terrain.
 *
 * Used as a toggleable alternative to the MapLibre+AWS-Terrain basemap in:
 *   • /map coverage page (app/(dashboard)/map/page.tsx)
 *   • Map3DEditor (src/components/Map3DEditor.tsx)
 *
 * This component is **view-only** — Mapbox Draw's editing tools are MapLibre
 * specific, so when the editor is in Cesium mode we render the existing
 * polyline + points as Cesium entities (no drawing). The MapLibre view is
 * still mounted in parallel and shown when the toggle flips back.
 *
 *   <CesiumViewer
 *     polyline={[[lng, lat], …]}    // optional legacy single polyline
 *     phases={[{ day, coordinates }]} // multi-day, color-coded
 *     points={[{ lng, lat, label, day }]}
 *     center={{ lng, lat }}
 *     zoom={9}
 *     basemap="satellite" | "map"    // Bing Aerial or OSM
 *     height={480}
 *   />
 *
 * Notes on the integration:
 *  • Cesium ships static Workers / Assets / Widgets that the runtime fetches
 *    relative to `window.CESIUM_BASE_URL`. We point that at a pinned CDN
 *    (jsDelivr) to avoid the Next.js static-asset bundling headache.
 *  • The component is dynamically imported (next/dynamic) with ssr:false at
 *    the call sites, so we never touch `window` on the server.
 *  • World Terrain is asset id 1 on Cesium ion; it requires a token. We use
 *    NEXT_PUBLIC_CESIUM_ION_TOKEN if set, otherwise Cesium's dev token.
 */
'use client';

import { useEffect, useRef } from 'react';
import {
  Cartesian3,
  CesiumTerrainProvider,
  Color,
  Entity,
  HeightReference,
  Ion,
  IonImageryProvider,
  LabelGraphics,
  LabelStyle,
  OpenStreetMapImageryProvider,
  PointGraphics,
  PolylineGraphics,
  Rectangle,
  VerticalOrigin,
  Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

export interface CesiumPin {
  lng: number;
  lat: number;
  label?: string;
  id?: string;
  /** Which day this pin belongs to (1-indexed). */
  day?: number;
}

export interface CesiumPhase {
  day: number;
  coordinates: [number, number][];
}

interface Props {
  /** Legacy single polyline (kept for the Map3DEditor fallback path). */
  polyline?: [number, number][];
  /** Multi-day shape — color-coded when supplied. */
  phases?: CesiumPhase[];
  /** Destination / waypoint pins. */
  points?: CesiumPin[];
  /** Initial camera. Defaults to Srinagar at zoom 9. */
  center?: { lng: number; lat: number };
  zoom?: number;
  /** Container height. Number → pixels, string → CSS (e.g. '100%'). */
  height?: number | string;
  /** Bing Aerial (default) or OpenStreetMap imagery. */
  basemap?: 'satellite' | 'map';
  /** Fires once when Cesium has loaded the first frame. */
  onReady?: () => void;
}

const DEFAULT_CENTER = { lng: 74.7973, lat: 34.0837 };
const DEFAULT_ZOOM = 9;

/** Day-color cycle — matches Map3DEditor's palette. */
const DAY_COLORS = [
  '#E8893A', // saffron
  '#2A5266', // dal
  '#2D6A4F', // emerald
  '#B23A2E', // chinar
  '#1F4788', // sapphire
  '#C9A227', // mustard
];
const dayColor = (d: number) => DAY_COLORS[(d - 1) % DAY_COLORS.length];

function hexToCesium(hex: string): Color {
  return Color.fromCssColorString(hex);
}

export function CesiumViewer({
  polyline,
  phases,
  points = [],
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = 480,
  basemap = 'satellite',
  onReady,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  /* ── Initialise the Cesium viewer once ─────────────────── */

  useEffect(() => {
    if (!containerRef.current) return;

    // Cesium needs a token before it can fetch ion assets. Prefer the
    // user-supplied env var; fall back to the Kashmir Explorer project
    // token committed here for local dev. Replace via
    // NEXT_PUBLIC_CESIUM_ION_TOKEN in .env.local for your own usage.
    const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJhMWVjODI1NS1hNmFiLTQzMDgtYjk1ZC1lZDBiNzNmMWI0ZWEiLCJpZCI6NDQwOTY1LCJpc3MiOiJodHRwczovL2FwaS5jZXNpdW0uY29tIiwiYXVkIjoidW5kZWZpbmVkX2RlZmF1bHQiLCJpYXQiOjE3ODA3MjgxOTR9.-pbu3CPFrxagY4yASHOy-xgjyH3-MIfxiCiI0N7ty5w';
    (window as any).CESIUM_BASE_URL = 'https://cdn.jsdelivr.net/npm/cesium@1.142.0/Build/Cesium/';
    Ion.defaultAccessToken = token;

    // Disable a handful of Cesium UI bits that fight the admin palette.
    const viewer = new Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      // Skip the default imagery — we'll add the one we want below.
      baseLayer: false,
    });
    viewerRef.current = viewer;

    // Cinematic sky + atmosphere defaults (matches the MapLibre view).
    const scene = viewer.scene;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
    scene.fog.enabled = true;
    scene.globe.enableLighting = false;
    scene.globe.depthTestAgainstTerrain = true;

    // The screen-space camera controller drives pan / zoom / tilt. By
    // default all inputs are on, but we set them explicitly so a future
    // Cesium version can't quietly turn them off and make the map look
    // frozen (this bit me on a 1.110→1.142 upgrade).
    const cam = scene.screenSpaceCameraController;
    cam.enableInputs = true;
    cam.enableTranslate = true;
    cam.enableZoom = true;
    cam.enableRotate = true;
    cam.enableTilt = true;
    cam.enableLook = true;
    // The wheel listener for zoom can be hijacked by a parent with
    // `overflow: hidden` + a wheel handler. Cesium uses a passive wheel
    // listener so this should be safe, but we set the min/max zoom range
    // explicitly to avoid the "wheel does nothing" surprise.
    cam.minimumZoomDistance = 1;        // 1 metre — close enough for street level
    cam.maximumZoomDistance = 50_000_000; // 50,000 km

    // Initial camera — Cesium uses radians + metres. zoom is rough; we
    // pick a height that gives a ~MapLibre-zoom 9 coverage of J&K.
    const initialHeight = zoomToHeight(zoom);
    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(center.lng, center.lat, initialHeight),
      orientation: {
        heading: 0,
        pitch: -Math.PI / 3, // ~60° down
        roll: 0,
      },
    });

    // Force a resize — the container may not have been laid out (or its
    // `height: 100%` may have resolved to 0px) at the time the Viewer
    // read clientWidth/clientHeight in the constructor. Without this
    // the canvas can be created with a 0×0 size and the wheel listener
    // never receives events.
    requestAnimationFrame(() => viewer.resize());

    // Initial basemap (the basemap effect re-applies on prop change).
    applyBasemap(viewer, basemap).catch((err) => {
      console.warn('[CesiumViewer] basemap load failed', err);
    });

    // World Terrain — asset id 1 on Cesium ion. Async because the provider
    // has to fetch metadata. If it fails (e.g. no token in a rate-limited
    // environment) we leave the default ellipsoid terrain in place so the
    // map still renders — just without the high-res relief. The token is
    // already set as `Ion.defaultAccessToken` above, so we don't pass it.
    CesiumTerrainProvider.fromIonAssetId(1)
      .then((provider) => {
        if (viewerRef.current) viewerRef.current.terrainProvider = provider;
      })
      .catch((err) => {
        console.warn('[CesiumViewer] World Terrain unavailable, falling back to ellipsoid', err);
      });

    onReady?.();

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Re-apply basemap when the prop changes ───────────── */

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    applyBasemap(viewer, basemap).catch((err) => {
      console.warn('[CesiumViewer] basemap switch failed', err);
    });
  }, [basemap]);

  /* ── Draw polylines + pins as Cesium entities ────────── */

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Drop our own entities; keep terrain / imagery.
    viewer.entities.removeAll();

    const phaseList: CesiumPhase[] =
      phases ??
      (polyline && polyline.length >= 2
        ? [{ day: 1, coordinates: polyline }]
        : []);

    for (const ph of phaseList) {
      if (ph.coordinates.length < 2) continue;
      const color = hexToCesium(dayColor(ph.day));
      viewer.entities.add(
        new Entity({
          properties: { day: ph.day, kind: 'trail' },
          polyline: new PolylineGraphics({
            positions: Cartesian3.fromDegreesArray(
              ph.coordinates.flatMap(([lng, lat]) => [lng, lat]),
            ),
            width: 5,
            material: color.withAlpha(0.85),
            clampToGround: true,
          }),
        }),
      );
    }

    for (const p of points) {
      const color = hexToCesium(dayColor(p.day ?? 1));
      const entityOpts: any = {
        id: p.id,
        properties: { kind: 'waypoint', day: p.day ?? 1, label: p.label },
        position: Cartesian3.fromDegrees(p.lng, p.lat),
        point: new PointGraphics({
          pixelSize: 11,
          color,
          outlineColor: Color.WHITE,
          outlineWidth: 2,
        }),
      };
      if (p.label) {
        entityOpts.label = new LabelGraphics({
          text: p.label,
          font: '11px sans-serif',
          fillColor: Color.WHITE,
          outlineColor: Color.BLACK,
          outlineWidth: 2,
          style: LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: { x: 0, y: -14 } as any,
          verticalOrigin: VerticalOrigin.BOTTOM,
          heightReference: HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        });
      }
      viewer.entities.add(new Entity(entityOpts));
    }

    // Fit camera to everything (with a small bias for single pins).
    const allCoords: [number, number][] = [
      ...phaseList.flatMap((ph) => ph.coordinates),
      ...points.map((p) => [p.lng, p.lat] as [number, number]),
    ];
    if (allCoords.length === 1) {
      const [lng, lat] = allCoords[0];
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lng, lat, 5_000),
        duration: 0,
      });
    } else if (allCoords.length > 1) {
      flyToCoords(viewer, allCoords);
    }
  }, [polyline, phases, points]);

  /* ── Re-fit when the container resizes ──────────────── */

  useEffect(() => {
    const container = containerRef.current;
    const viewer = viewerRef.current;
    if (!container || !viewer) return;
    const ro = new ResizeObserver(() => viewer.resize());
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      // position: relative is REQUIRED — Cesium's cesium-viewer is
      // absolutely positioned, and without a positioned ancestor it
      // positions against the wrong parent (which can leave the canvas
      // clipped or offset, breaking pointer events / wheel zoom).
      style={{ position: 'relative', width: '100%', height, background: '#0b1a26' }}
      className="rounded-btn overflow-hidden"
    />
  );
}

/* ─── Helpers ─────────────────────────────────────────── */

/** Rough MapLibre-zoom → metres-altitude mapping for the initial camera. */
function zoomToHeight(zoom: number): number {
  // Web-mercator at lat 34°: z9 ≈ 250 km, z12 ≈ 30 km, z15 ≈ 4 km
  return Math.round(40_000_000 / Math.pow(2, zoom + 1));
}

/**
 * Replace all base imagery layers with a single layer of the chosen kind.
 * Bing Aerial is Cesium ion asset 2 (requires token); OSM is free.
 */
async function applyBasemap(
  viewer: Viewer,
  kind: 'satellite' | 'map',
): Promise<void> {
  // Remove every existing imagery layer.
  const layers = viewer.imageryLayers;
  while (layers.length > 0) layers.remove(layers.get(0), true);

  if (kind === 'satellite') {
    // Token is already set globally as `Ion.defaultAccessToken`, so we
    // can call fromAssetId with no options.
    const provider = await IonImageryProvider.fromAssetId(2);
    layers.addImageryProvider(provider);
  } else {
    const provider = new OpenStreetMapImageryProvider({
      url: 'https://tile.openstreetmap.org/',
    });
    layers.addImageryProvider(provider);
  }
}

/** Fit the camera to a list of lng/lat pairs. */
function flyToCoords(viewer: Viewer, coords: [number, number][]): void {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  // If the extent is essentially a point, fly to it; otherwise rectangle-fit.
  if (Math.abs(maxLng - minLng) < 1e-4 && Math.abs(maxLat - minLat) < 1e-4) {
    const [lng, lat] = coords[0];
    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(lng, lat, 5_000),
      duration: 0,
    });
    return;
  }
  // A modest padding (5% of the extent) keeps markers away from the edge.
  const padLng = (maxLng - minLng) * 0.05;
  const padLat = (maxLat - minLat) * 0.05;
  const rect = Rectangle.fromDegrees(
    minLng - padLng,
    minLat - padLat,
    maxLng + padLng,
    maxLat + padLat,
  );
  viewer.camera.flyTo({
    destination: rect,
    orientation: { heading: 0, pitch: -Math.PI / 3, roll: 0 },
    duration: 0,
  });
}
