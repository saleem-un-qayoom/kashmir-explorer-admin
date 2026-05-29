'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { destinations, categories as categoriesApi, type Destination } from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';
import { MapView } from '@/components/MapView';
import { TRAIL_FEATURES } from '@/components/FeatureChips';
import { ToggleGrid } from '@/components/ToggleGrid';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const REGIONS = ['central', 'north', 'south', 'ladakh', 'jammu'];
const SEASONS = ['year-round', 'summer', 'winter', 'spring', 'autumn'];

export default function DestinationDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data, isLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => destinations.adminGet(id),
    enabled: !isNew,
  });

  // Load real categories from the API so chips match the actual DB.
  const { data: allCats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60_000,
  });

  const [form, setForm] = useState<Partial<Destination>>({
    is_published: true,
    is_featured: false,
    best_months: [],
    permits: [],
    categories: [],
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: async (): Promise<{ id?: string; updated?: string }> => {
      const payload: any = { ...form };
      if (!payload.name?.trim()) throw new Error('Destination name is required.');
      if (!payload.slug?.trim()) payload.slug = slugify(payload.name);
      if (isNew) return destinations.create(payload);
      return destinations.update(id, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['destinations-admin'] });
      qc.invalidateQueries({ queryKey: ['destination', id] });
      router.push('/destinations');
    },
  });

  const set = <K extends keyof Destination>(key: K, val: Destination[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  if (isLoading && !isNew) {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Loading destination...</div>;
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'New Destination' : `Edit: ${form.name ?? ''}`}
        subtitle={isNew ? 'Add a new destination' : form.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/destinations')}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={() => save.mutate()}
              disabled={save.isPending}
            >
              {save.isPending ? 'Saving...' : isNew ? 'Create' : 'Save changes'}
            </button>
          </div>
        }
      />

      {save.isError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {(save.error as Error).message}
        </div>
      )}

      {/* AllTrails-style hero gallery — promoted to top of page */}
      {!isNew && (
        <div className="px-8 pt-6">
          <Section title="Hero gallery">
            <ImageUploader entityType="destination" entityId={id} />
            <p className="text-[11px] text-ink-3 mt-3 leading-relaxed">
              First image (or the one marked HERO) is shown at the top of the mobile detail screen.
            </p>
          </Section>
        </div>
      )}

      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Section title="Basic Info">
            <Field label="Name" required>
              <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Slug">
              <input
                className="input font-mono text-sm"
                value={form.slug ?? ''}
                onChange={(e) => set('slug', e.target.value)}
                placeholder={form.name ? slugify(form.name) : 'auto-generated from name'}
              />
              <p className="text-[10px] text-ink-3 mt-1 tracking-wide">
                Leave blank to auto-generate from the name. Used in the mobile app URL.
              </p>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name (Urdu)">
                <input
                  className="input"
                  dir="rtl"
                  value={form.name_urdu ?? ''}
                  onChange={(e) => set('name_urdu', e.target.value)}
                />
              </Field>
              <Field label="Name (Hindi)">
                <input
                  className="input"
                  value={form.name_hindi ?? ''}
                  onChange={(e) => set('name_hindi', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Tagline">
              <input
                className="input"
                value={form.tagline ?? ''}
                onChange={(e) => set('tagline', e.target.value)}
                placeholder="Short one-liner"
              />
            </Field>
            <Field label="Uniqueness">
              <textarea
                className="input min-h-[80px]"
                value={form.uniqueness ?? ''}
                onChange={(e) => set('uniqueness', e.target.value)}
                placeholder="What makes this special?"
              />
            </Field>
            <Field label="Description">
              <textarea
                className="input min-h-[120px]"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Full description..."
              />
            </Field>
          </Section>

          <Section title="Location">
            <MapView
              lat={form.lat}
              lng={form.lng}
              onMove={(lat, lng) => { set('lat', lat); set('lng', lng); }}
              height={220}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Region">
                <select
                  className="input"
                  value={form.region_slug ?? ''}
                  onChange={(e) => set('region_slug' as any, e.target.value)}
                >
                  <option value="">Select...</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="District">
                <input
                  className="input"
                  value={form.district ?? ''}
                  onChange={(e) => set('district', e.target.value)}
                />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Latitude">
                <input
                  className="input font-mono"
                  type="number"
                  step="0.0001"
                  value={form.lat ?? ''}
                  onChange={(e) => set('lat', parseFloat(e.target.value))}
                />
              </Field>
              <Field label="Longitude">
                <input
                  className="input font-mono"
                  type="number"
                  step="0.0001"
                  value={form.lng ?? ''}
                  onChange={(e) => set('lng', parseFloat(e.target.value))}
                />
              </Field>
              <Field label="Altitude (m)">
                <input
                  className="input font-mono"
                  type="number"
                  value={form.altitude_m ?? ''}
                  onChange={(e) => set('altitude_m', parseInt(e.target.value))}
                />
              </Field>
            </div>
            <Field label="Distance from Srinagar (km)">
              <input
                className="input font-mono"
                type="number"
                value={form.distance_from_srinagar_km ?? ''}
                onChange={(e) => set('distance_from_srinagar_km', parseInt(e.target.value))}
              />
            </Field>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Season & Access">
            <Field label="Season Type">
              <select
                className="input"
                value={form.season_type ?? ''}
                onChange={(e) => set('season_type', e.target.value)}
              >
                <option value="">Select...</option>
                {SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Best Months">
              <div className="flex flex-wrap gap-2">
                {MONTHS.map((m, i) => {
                  const month = i + 1;
                  const active = form.best_months?.includes(month);
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                        active
                          ? 'bg-dal text-white border-dal'
                          : 'bg-white text-ink-2 border-line hover:border-dal/50'
                      }`}
                      onClick={() => {
                        const months = form.best_months ?? [];
                        set(
                          'best_months',
                          active
                            ? months.filter((x) => x !== month)
                            : [...months, month].sort((a, b) => a - b),
                        );
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Entry Fee (INR)">
              <input
                className="input font-mono"
                type="number"
                value={form.entry_fee_inr ?? 0}
                onChange={(e) => set('entry_fee_inr', parseInt(e.target.value))}
              />
            </Field>
            <Field label="Permits">
              <input
                className="input"
                value={(form.permits ?? []).join(', ')}
                onChange={(e) =>
                  set(
                    'permits',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="ILP, wildlife (comma-separated)"
              />
            </Field>
          </Section>

          <Section title="Categories">
            {allCats.length === 0 ? (
              <p className="text-xs text-ink-3 italic">Loading…</p>
            ) : (
              <ToggleGrid
                value={(form.categories ?? []).filter(Boolean)}
                options={allCats.map((c) => ({ id: c.slug, label: c.name, color: c.color }))}
                onChange={(v) => set('categories', v)}
              />
            )}
          </Section>

          <Section title="Activities">
            <ToggleGrid
              value={(form.activities ?? []).filter(Boolean)}
              options={[
                { id: 'trekking',       label: 'Trekking',       color: '#2D6A4F' },
                { id: 'sightseeing',    label: 'Sightseeing',    color: '#2A5266' },
                { id: 'boating',        label: 'Boating',        color: '#4A8FB5' },
                { id: 'skiing',         label: 'Skiing',         color: '#EDF2F5' },
                { id: 'bird-watching',  label: 'Bird watching',  color: '#2D6A4F' },
                { id: 'camping',        label: 'Camping',        color: '#8B4513' },
                { id: 'photography',    label: 'Photography',    color: '#C9A227' },
                { id: 'fishing',        label: 'Fishing',        color: '#4A8FB5' },
                { id: 'heritage-walk',  label: 'Heritage walk',  color: '#C72D3D' },
                { id: 'river-rafting',  label: 'River rafting',  color: '#1F4788' },
                { id: 'gondola',        label: 'Gondola',        color: '#2A5266' },
                { id: 'shopping',       label: 'Shopping',       color: '#D97444' },
              ]}
              onChange={(v) => set('activities', v)}
            />
          </Section>

          <Section title="Trail features">
            <ToggleGrid
              value={((form as any).features ?? []).filter(Boolean)}
              options={TRAIL_FEATURES.map((f) => ({ id: f.id, label: f.label, color: undefined }))}
              onChange={(v) => set('features' as any, v as any)}
              cols={3}
            />
            <p className="text-[11px] text-ink-3 mt-3">
              Powers the AllTrails-style filter on the mobile Explore screen.
            </p>
          </Section>

          <Section title="Network Coverage">
            {(['jio', 'airtel', 'bsnl'] as const).map((op) => (
              <div key={op} className="flex items-center gap-3">
                <span className="text-sm font-medium w-16 uppercase">{op}</span>
                <select
                  className="input flex-1"
                  value={(form.network_coverage as any)?.[op] ?? ''}
                  onChange={(e) => set('network_coverage', {
                    ...((form.network_coverage ?? {}) as any),
                    [op]: e.target.value || undefined,
                  } as any)}
                >
                  <option value="">Auto</option>
                  <option value="good">Good</option>
                  <option value="patchy">Patchy</option>
                  <option value="none">None</option>
                </select>
              </div>
            ))}
          </Section>

          <Section title="Practical Info">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form.practical as any)?.atm ?? false} onChange={(e) => set('practical', { ...((form.practical ?? {}) as any), atm: e.target.checked } as any)} className="accent-dal w-4 h-4" />
              <span className="text-sm font-medium">ATM available</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form.practical as any)?.drone ?? false} onChange={(e) => set('practical', { ...((form.practical ?? {}) as any), drone: e.target.checked } as any)} className="accent-chinar w-4 h-4" />
              <span className="text-sm font-medium">Drone allowed</span>
            </label>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Fuel station (km)</label>
                <input className="input font-mono" type="number" value={(form.practical as any)?.fuel_km ?? ''} onChange={(e) => set('practical', { ...((form.practical ?? {}) as any), fuel_km: parseInt(e.target.value) || undefined } as any)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Toilet</label>
                <select className="input" value={(form.practical as any)?.toilet ?? ''} onChange={(e) => set('practical', { ...((form.practical ?? {}) as any), toilet: e.target.value || undefined } as any)}>
                  <option value="">Unknown</option>
                  <option value="clean">Clean</option>
                  <option value="basic">Basic</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </Section>

          <Section title="Publishing">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published ?? false}
                  onChange={(e) => set('is_published', e.target.checked)}
                  className="accent-dal w-4 h-4"
                />
                <span className="text-sm font-medium">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured ?? false}
                  onChange={(e) => set('is_featured', e.target.checked)}
                  className="accent-saffron w-4 h-4"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
          </Section>

          {!isNew && (
            <Section title="Stats (read-only)">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-pashmina/40 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-dal">{form.rating?.toFixed(1) ?? '—'}</div>
                  <div className="text-[10px] tracking-wider text-ink-3 mt-1">RATING</div>
                </div>
                <div className="text-center p-4 bg-pashmina/40 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-dal">
                    {form.review_count?.toLocaleString('en-IN') ?? '—'}
                  </div>
                  <div className="text-[10px] tracking-wider text-ink-3 mt-1">REVIEWS</div>
                </div>
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
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
