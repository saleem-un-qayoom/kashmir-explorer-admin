'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { treks, tracks, apiGet, type Trek } from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';
import { TrailEditor } from '@/components/TrailEditor';
import { Map3DEditor, type PhaseSegment } from '@/components/Map3DEditor';
import { GPXUploader, type ParsedGPX } from '@/components/GPXUploader';
import { TrailSectionEditor } from '@/components/TrailSectionEditor';
import type { TrailSection } from '@/lib/api';
import { WaypointEditor, type Waypoint } from '@/components/WaypointEditor';
import { GearListEditor, type GearItem } from '@/components/GearListEditor';
import {
  FeatureChips,
  TRAIL_FEATURES,
  TRAIL_ACTIVITIES,
  ROUTE_TYPES,
} from '@/components/FeatureChips';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DIFFICULTIES = ['easy', 'moderate', 'hard', 'strenuous'] as const;
const TYPES = ['meadow', 'alpine_lake', 'glacier', 'pass', 'valley'] as const;
const STATUSES = ['open', 'closing-soon', 'closed'] as const;

export default function TrekDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['trek', id],
    queryFn: () => treks.adminGet(id),
    enabled: id !== 'new',
  });

  const [form, setForm] = useState<Partial<Trek>>({
    status: 'open',
    difficulty: 'moderate',
    trek_type: 'meadow',
    best_months: [],
    permits: [],
    guide_available: true,
    ams_risk: false,
    is_published: true, // default publish — author can uncheck to keep as draft
  });
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('3d');

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      // Auto-slug + sanity-check before the network round-trip.
      const payload: any = { ...form };
      if (!payload.name?.trim()) {
        throw new Error('Trek name is required.');
      }
      if (!payload.slug?.trim()) {
        payload.slug = slugify(payload.name);
      }
      if (id === 'new') return treks.create(payload);
      return treks.update(id, payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treks'] }); router.push('/treks'); },
  });

  const set = <K extends keyof Trek>(key: K, val: Trek[K]) => setForm((f) => ({ ...f, [key]: val }));

  if (isLoading && id !== 'new') {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Loading trek…</div>;
  }

  return (
    <>
      <PageHeader
        title={id === 'new' ? 'New Trek' : `Edit: ${form.name ?? ''}`}
        subtitle={id === 'new' ? 'Add a new trek route' : form.slug}
        action={
          <div className="flex items-center gap-3">
            {/* Publish status pill — always visible so it's never missed */}
            <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer text-xs font-medium transition ${
              (form as any).is_published
                ? 'bg-emerald/10 border-emerald text-emerald'
                : 'bg-amber/10 border-amber text-amber'
            }`}>
              <input
                type="checkbox"
                checked={(form as any).is_published ?? false}
                onChange={(e) => set('is_published' as any, e.target.checked)}
                className="accent-emerald"
              />
              {(form as any).is_published ? 'PUBLISHED · VISIBLE ON MOBILE' : 'DRAFT · HIDDEN'}
            </label>
            <button className="btn btn-ghost" onClick={() => router.push('/treks')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving...' : id === 'new' ? 'Create' : 'Save changes'}
            </button>
          </div>
        }
      />

      {save.isError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {(save.error as Error).message}
        </div>
      )}

      {/* AllTrails-style hero strip — gallery + at-a-glance stats */}
      {id !== 'new' && (
        <div className="px-8 pt-6">
          <Section title="Hero gallery">
            <ImageUploader entityType="trek" entityId={id} />
            <p className="text-[11px] text-ink-3 mt-3 leading-relaxed">
              First image (or the one marked HERO) is shown at the top of the mobile detail screen.
              Drop multiple to power the tour gallery.
            </p>
          </Section>
        </div>
      )}

      {/* Side panels — recent trail reports + community recordings */}
      {id !== 'new' && form.slug && (
        <div className="px-8 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <TrailReportsSidePanel slug={form.slug} />
          <RecordingsSidePanel slug={form.slug} />
        </div>
      )}

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section title="Basic Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="Slug" required>
                <input className="input font-mono text-sm" value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="great-lakes" />
              </Field>
            </div>
            <Field label="Tagline">
              <input className="input" value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Short one-liner" />
            </Field>
            <Field label="Uniqueness">
              <textarea className="input min-h-[60px]" value={form.uniqueness ?? ''} onChange={(e) => set('uniqueness', e.target.value)} placeholder="What makes this special?" />
            </Field>
          </Section>

          <Section title="Route Details">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Difficulty">
                <select className="input" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as any)}>
                  {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Type">
                <select className="input" value={form.trek_type} onChange={(e) => set('trek_type', e.target.value)}>
                  {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Duration (days)">
                <input className="input" type="number" min={1} value={form.duration_days ?? ''} onChange={(e) => set('duration_days', parseInt(e.target.value))} />
              </Field>
              <Field label="Distance (km)">
                <input className="input font-mono" type="number" step="0.1" value={form.distance_km ?? ''} onChange={(e) => set('distance_km' as any, parseFloat(e.target.value))} />
              </Field>
              <Field label="Max altitude (m)">
                <input className="input font-mono" type="number" value={form.max_altitude_m ?? ''} onChange={(e) => set('max_altitude_m', parseInt(e.target.value))} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Start point">
                <input className="input" value={form.start_point ?? ''} onChange={(e) => set('start_point', e.target.value)} placeholder="Sonamarg" />
              </Field>
              <Field label="End point">
                <input className="input" value={form.end_point ?? ''} onChange={(e) => set('end_point', e.target.value)} placeholder="Naranag" />
              </Field>
            </div>
            <Field label="Closure reason">
              <input className="input" value={form.closure_reason ?? ''} onChange={(e) => set('closure_reason', e.target.value)} placeholder="If closed, why?" />
            </Field>
          </Section>

          <Section title="Season & Permits">
            <Field label="Best Months">
              <div className="flex flex-wrap gap-2">
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const active = form.best_months?.includes(month);
                  return (
                    <button key={m} type="button"
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        active ? 'bg-dal text-white border-dal' : 'bg-white text-ink-2 border-line'
                      }`}
                      onClick={() => {
                        const months = form.best_months ?? [];
                        set('best_months', active ? months.filter((x) => x !== month) : [...months, month].sort());
                      }}
                    >{m}</button>
                  );
                })}
              </div>
            </Field>
            <Field label="Required Permits">
              <input className="input" value={(form.permits ?? []).join(', ')}
                onChange={(e) => set('permits', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="ILP, wildlife (comma-separated)" />
            </Field>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Map & Trail">
            {/* GPX import — populates polyline + waypoints + optionally trek name */}
            <GPXUploader
              onParsed={(gpx: ParsedGPX) => {
                setForm((f: any) => {
                  const next = {
                    ...f,
                    path_geojson: gpx.polyline,
                    // Each <trkseg> in the GPX → one phase (day) in the editor.
                    path_phases: gpx.phases,
                  };
                  // Merge waypoints if the GPX brings any (don't blow away
                  // existing manual entries if the file has none).
                  if (gpx.waypoints.length) {
                    next.waypoints = gpx.waypoints.map((w, i) => ({
                      day: 1, // editor lets the user split across days afterwards
                      name: w.name || `Waypoint ${i + 1}`,
                      type: w.type,
                      altitudeM: w.altitudeM,
                      lat: w.lat,
                      lng: w.lng,
                      notes: w.notes,
                    }));
                    next.waypoint_coords = gpx.waypoints.map((w) => ({
                      lng: w.lng,
                      lat: w.lat,
                      name: w.name,
                    }));
                  }
                  // Best-effort autofill for empty fields
                  if (!f.name && gpx.trackName) next.name = gpx.trackName;
                  return next;
                });
              }}
            />

            {/* Clear trail (manual reset before re-drawing or re-uploading) */}
            {((form as any).path_geojson?.length || form.waypoints?.length) && (
              <button
                type="button"
                onClick={() => {
                  if (!confirm('Clear the drawn trail and waypoint coordinates?')) return;
                  setForm((f: any) => ({
                    ...f,
                    path_geojson: [],
                    waypoint_coords: [],
                    waypoints: (f.waypoints ?? []).map((w: any) => ({
                      ...w, lat: undefined, lng: undefined,
                    })),
                  }));
                }}
                className="text-xs text-chinar font-medium tracking-wide my-3 inline-flex items-center gap-1"
              >
                ✕ Clear trail
              </button>
            )}

            {/* 2D / 3D toggle */}
            <div className="flex gap-1 mb-3 p-0.5 bg-pashmina/60 rounded-md w-fit">
              {(['2d', '3d'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMapMode(m)}
                  className={`px-3 py-1 text-[10px] font-mono tracking-wider rounded-sm transition ${
                    mapMode === m ? 'bg-white text-ink shadow-sm' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {m === '3d' ? '3D · TERRAIN' : '2D · LEAFLET'}
                </button>
              ))}
            </div>
            {mapMode === '3d' ? (
              <Map3DEditor
                phases={normalizePhases((form as any).path_geojson, (form as any).path_phases)}
                points={(form.waypoints ?? []).filter((w: any) => w.lat && w.lng).map((w: any) => ({
                  lng: w.lng, lat: w.lat, label: w.name, day: w.day ?? 1,
                }))}
                onChange={({ polyline, points, phases }) => {
                  setForm((f: any) => ({
                    ...f,
                    // Persist both shapes — the legacy single polyline (largest day)
                    // and the new per-day phases array.
                    path_geojson: polyline,
                    path_phases: phases ?? [],
                    waypoint_coords: points.map((p) => ({
                      lng: p.lng, lat: p.lat, name: p.label ?? '', day: p.day ?? 1,
                    })),
                  }));
                }}
                height={480}
              />
            ) : (
              <TrailEditor
                polyline={(form as any).path_geojson ?? []}
                onChange={(polyline, coords) => {
                  setForm((f: any) => ({ ...f, path_geojson: polyline, waypoint_coords: coords }));
                }}
                height={300}
              />
            )}
            {/* Sanity-check button — opens Google Maps directions to the first
                waypoint so content teams can verify the trailhead coords. */}
            {(form.waypoints?.[0]?.lat && form.waypoints?.[0]?.lng) ? (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${form.waypoints[0].lat},${form.waypoints[0].lng}&travelmode=driving`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-xs inline-flex items-center gap-1.5 mt-3"
              >
                <span>↗</span> Preview directions to start
              </a>
            ) : (
              <p className="text-[11px] text-ink-3 mt-3">
                Add a first waypoint with lat/lng to preview driving directions to the trailhead.
              </p>
            )}
            <Field label="Waypoints">
              <WaypointEditor
                value={(form.waypoints as Waypoint[]) ?? []}
                onChange={(wps) => set('waypoints' as any, wps as any)}
              />
            </Field>
          </Section>

          <Section title="Gear list">
            <GearListEditor
              value={(form.gear_list as GearItem[]) ?? []}
              onChange={(gl) => set('gear_list' as any, gl as any)}
            />
          </Section>

          <Section title="Trail Sections (Camps / Stops)">
            <TrailSectionEditor
              sections={(form.trail_sections as TrailSection[]) ?? []}
              onChange={(sections) => set('trail_sections' as any, sections)}
            />
          </Section>

          <Section title="Safety">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ams_risk ?? false}
                onChange={(e) => set('ams_risk', e.target.checked)}
                className="accent-chinar w-4 h-4"
              />
              <span className="text-sm font-medium">AMS risk (high altitude)</span>
            </label>
            <div className="text-xs text-ink-3">
              When checked, the mobile app shows the AMS Coach banner on the trek detail (also auto-shows when max altitude ≥ 3000 m).
            </div>
          </Section>

          <Section title="Discovery · features & activities">
            <Field label="Trail features">
              <FeatureChips
                value={form.features ?? []}
                options={TRAIL_FEATURES}
                onChange={(v) => set('features' as any, v as any)}
              />
            </Field>
            <Field label="Activities">
              <FeatureChips
                value={form.activities ?? []}
                options={TRAIL_ACTIVITIES}
                onChange={(v) => set('activities' as any, v as any)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Route type">
                <select
                  className="input"
                  value={form.route_type ?? 'out-and-back'}
                  onChange={(e) => set('route_type' as any, e.target.value as any)}
                >
                  {ROUTE_TYPES.map((r) => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Elevation gain (m)">
                <input
                  className="input font-mono"
                  type="number"
                  value={form.elevation_gain_m ?? ''}
                  onChange={(e) => set('elevation_gain_m' as any, parseInt(e.target.value) as any)}
                  placeholder="e.g. 1850"
                />
              </Field>
            </div>
          </Section>

          <Section title="Publishing">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form as any).is_published ?? false} onChange={(e) => set('is_published' as any, e.target.checked)} className="accent-dal w-4 h-4" />
              <span className="text-sm font-medium">Published</span>
            </label>
          </Section>

        </div>
      </div>
    </>
  );
}

/* ─── Side panels: trail conditions + community recordings ─── */

function TrailReportsSidePanel({ slug }: { slug: string }) {
  const q = useQuery({
    queryKey: ['trail-reports', 'public', slug],
    queryFn: () => apiGet<any[]>(`treks/${slug}/reports`),
  });
  const reports = q.data ?? [];
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm tracking-wider text-ink-3">RECENT TRAIL REPORTS</h3>
        <span className="font-mono text-[10px] text-ink-3">{reports.length} ACTIVE</span>
      </div>
      {reports.length === 0 ? (
        <p className="font-quote italic text-sm text-ink-3">
          “Aab-e-Saaf — no community reports on this trek.”
        </p>
      ) : (
        <ul className="space-y-2">
          {reports.slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-start gap-3 text-sm border-l-2 border-amber pl-3 py-1">
              <span className="pill pill-neutral shrink-0">{(r.category ?? 'other').toUpperCase()}</span>
              <div className="flex-1 min-w-0">
                <div className="text-ink truncate">{r.body || '—'}</div>
                <div className="text-[10px] text-ink-3 font-mono tracking-wider mt-0.5">
                  · SEV {r.severity ?? 3}/5 · {new Date(r.created_at).toLocaleDateString('en-IN')}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <a href="/trail-reports" className="text-xs text-dal font-medium tracking-wide mt-3 inline-block">
        VIEW ALL →
      </a>
    </div>
  );
}

function RecordingsSidePanel({ slug }: { slug: string }) {
  // Show recordings that match this trek_slug
  const q = useQuery({
    queryKey: ['tracks', 'admin'],
    queryFn: () => tracks.list(),
  });
  const matched = (q.data ?? []).filter((t) => t.trek_slug === slug).slice(0, 6);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading text-sm tracking-wider text-ink-3">COMMUNITY RECORDINGS</h3>
        <span className="font-mono text-[10px] text-ink-3">{matched.length} HIKES</span>
      </div>
      {matched.length === 0 ? (
        <p className="font-quote italic text-sm text-ink-3">
          “Aab-e-Hayat — no one has hiked this on record yet.”
        </p>
      ) : (
        <ul className="space-y-2">
          {matched.map((t) => (
            <li key={t.id} className="flex items-center gap-3 text-sm">
              <span className="font-medium text-ink truncate flex-1">{t.name}</span>
              <span className="font-mono text-[10px] text-ink-3 tracking-wider">
                {(t.distance_m / 1000).toFixed(1)} km · ↑ {t.gain_m} m
              </span>
            </li>
          ))}
        </ul>
      )}
      <a href="/tracks" className="text-xs text-dal font-medium tracking-wide mt-3 inline-block">
        VIEW ALL →
      </a>
    </div>
  );
}

/** kebab-case slug from a free-text name. Mirrors the Go side's
 *  expectation: lowercase, ASCII, hyphen-separated, no leading/trailing
 *  hyphens. "Kashmir Great Lakes" → "kashmir-great-lakes". */
function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')      // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Coerce legacy single-polyline data into the new phase shape so the
 *  multi-day editor can read it. New treks save `path_phases` directly. */
function normalizePhases(
  legacyPath: any,
  phases: PhaseSegment[] | undefined,
): PhaseSegment[] {
  if (phases && phases.length) return phases;
  if (Array.isArray(legacyPath) && legacyPath.length >= 2 && Array.isArray(legacyPath[0])) {
    return [{ day: 1, coordinates: legacyPath as [number, number][] }];
  }
  return [{ day: 1, coordinates: [] }];
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="font-heading text-sm tracking-wider text-ink-3 mb-4">{title.toUpperCase()}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-1">
        {label} {required && <span className="text-chinar">*</span>}
      </label>
      {children}
    </div>
  );
}
