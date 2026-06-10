'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input, Textarea, Select, Checkbox, MultiSelect } from '@/components/FormControls';
import { destinations, categories as categoriesApi, permits, regions as regionsApi, type Destination } from '@/lib/api';
import { ImageUploader } from '@/components/ImageUploader';
import { TRAIL_FEATURES } from '@/components/FeatureChips';
import { ToggleGrid } from '@/components/ToggleGrid';

// @import url('https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap');

const MapView = dynamic(
  () => import('@/components/MapView').then((m) => m.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full rounded-btn border border-line bg-pashmina/30 animate-pulse flex items-center justify-center">
        <span className="text-xs text-ink-3 font-mono">Loading map…</span>
      </div>
    ),
  },
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SEASON_OPTIONS = ['year-round', 'summer', 'winter', 'spring', 'autumn'].map((s) => ({ value: s, label: s }));
const DISTRICT_OPTIONS = [
  'Anantnag',
  'Bandipora',
  'Baramulla',
  'Budgam',
  'Ganderbal',
  'Kulgam',
  'Kupwara',
  'Pulwama',
  'Shopian',
  'Srinagar',
  'Doda',
  'Jammu',
  'Kathua',
  'Kishtwar',
  'Poonch',
  'Rajouri',
  'Ramban',
  'Reasi',
  'Samba',
  'Udhampur',
  'Kargil',
  'Leh',
].map((d) => ({ value: d, label: d }));
const COVERAGE_OPTIONS = [
  { value: '', label: 'Auto' },
  { value: 'good', label: 'Good' },
  { value: 'patchy', label: 'Patchy' },
  { value: 'none', label: 'None' },
];
const TOILET_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'clean', label: 'Clean' },
  { value: 'basic', label: 'Basic' },
  { value: 'paid', label: 'Paid' },
  { value: 'none', label: 'None' },
];

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

  const { data: allCats = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60_000,
    retry: 1,
    gcTime: 30_000,
  });

  const { data: allPermits = [] } = useQuery({
    queryKey: ['permits'],
    queryFn: () => permits.list(),
    staleTime: 5 * 60_000,
    retry: 1,
    gcTime: 30_000,
  });

  const { data: allRegions = [] } = useQuery({
    queryKey: ['regions'],
    queryFn: () => regionsApi.list(),
    staleTime: 5 * 60_000,
    retry: 1,
    gcTime: 30_000,
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
  }, [data, isNew]);

  const save = useMutation({
    mutationFn: async (): Promise<{ id?: string; updated?: string }> => {
      const payload: any = { ...form };
      if (!payload.name?.trim()) throw new Error('Destination name is required.');
      if (!payload.slug?.trim()) payload.slug = slugify(payload.name);
      if (isNew) return destinations.create(payload);
      return destinations.update(id, payload);
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['destinations-admin'] });
      qc.invalidateQueries({ queryKey: ['destination', id] });
      // For a brand-new destination, land on its edit page so the hero gallery
      // (image uploader) becomes available to attach photos.
      if (isNew && res?.id) router.replace(`/destinations/${res.id}`);
      else router.push('/destinations');
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
            <button
              className="btn btn-ghost transition-all duration-200 hover:bg-opacity-80 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              onClick={() => router.push('/destinations')}
            >
              Cancel
            </button>
            <button
              className="btn bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl focus:ring-2 focus:ring-purple-500/50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Hero Gallery - For both new and existing destinations */}
      <div className="p-8 pb-4">
        <Section title="Hero Gallery">
          {isNew ? (
            <div className="space-y-3">
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                  📸 Save destination first to add images
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-2">
                  After creating this destination, you'll be able to upload banner images and mark which one appears on the mobile detail screen.
                </p>
              </div>
            </div>
          ) : (
            <>
              <ImageUploader entityType="destination" entityId={id} />
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
                First image (or the one marked HERO) is displayed at the top of the mobile detail screen. You can upload, edit captions, remove images, or mark one as the hero banner.
              </p>
            </>
          )}
        </Section>
      </div>

      <div className="p-8 space-y-8">
        {/* 1. BASIC INFORMATION */}
        <Section title="Basic Information">
          <Field label="Name" required>
            <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} placeholder="Destination name" />
          </Field>
          <Field label="Slug">
            <Input
              className="font-mono text-sm"
              value={form.slug ?? ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder={form.name ? slugify(form.name) : 'auto-generated from name'}
            />
            <p className="text-[10px] text-ink-3 mt-1 tracking-wide">
              Leave blank to auto-generate. Used in mobile app URL.
            </p>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Name (Urdu)">
              <Input dir="rtl" value={form.name_urdu ?? ''} onChange={(e) => set('name_urdu', e.target.value)} />
            </Field>
            <Field label="Name (Hindi)">
              <Input value={form.name_hindi ?? ''} onChange={(e) => set('name_hindi', e.target.value)} />
            </Field>
          </div>
        </Section>

        {/* 2. CONTENT & DESCRIPTION */}
        <Section title="Content & Description">
          <Field label="Tagline">
            <Input value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Short one-liner shown in lists" />
          </Field>
          <Field label="Uniqueness" required>
            <Textarea
              className="min-h-[80px]"
              value={form.uniqueness ?? ''}
              onChange={(e) => set('uniqueness', e.target.value)}
              placeholder="What makes this special? (shown as pull quote)"
            />
          </Field>
          <Field label="Description" required>
            <Textarea
              className="min-h-[120px]"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Full editorial description shown on mobile detail screen"
            />
          </Field>
        </Section>

        {/* 3. LOCATION & MAP */}
        <Section title="Location & Map">
          <div className="space-y-5">
            {/* MAP - Clean, full-width */}
            <div>
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                <MapView
                  lat={form.lat}
                  lng={form.lng}
                  onMove={(lat, lng) => {
                    set('lat', lat);
                    set('lng', lng);
                    // Auto-fill distance from Srinagar
                    const srinagar = [34.08, 74.80];
                    const distance = Math.sqrt(Math.pow(lat - srinagar[0], 2) + Math.pow(lng - srinagar[1], 2)) * 111;
                    set('distance_from_srinagar_km', Math.round(distance));
                  }}
                  name={form.name ?? ''}
                  onNameChange={() => {}}
                  showFields={false}
                  height={420}
                />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-3 font-medium">
                💡 Click or drag the pin to set location. Distance from Srinagar auto-calculates.
              </p>
            </div>

            {/* LOCATION DETAILS - Organized Below Map */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Location Details</h4>
                <button
                  type="button"
                  onClick={() => {
                    set('lat', undefined);
                    set('lng', undefined);
                    set('district', '');
                    set('tehsil' as any, '');
                    set('address' as any, '');
                    set('altitude_m', undefined);
                    set('distance_from_srinagar_km', undefined);
                  }}
                  className="text-[10px] px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors font-semibold"
                >
                  🔄 Reset
                </button>
              </div>

              {/* Region — resolves region_id server-side; without it the destination is invisible to region browsing */}
              <div className="mb-4">
                <Field label="Region" required>
                  <Select
                    options={allRegions.map((r) => ({ value: r.slug, label: r.name }))}
                    value={form.region_slug ?? ''}
                    onChange={(v) => set('region_slug', v)}
                    placeholder="Select region…"
                    isClearable
                  />
                </Field>
              </div>

              {/* Row 1: District & Tehsil */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Field label="District" required>
                  <Select
                    options={DISTRICT_OPTIONS}
                    value={form.district ?? ''}
                    onChange={(v) => set('district', v)}
                    placeholder="Select..."
                    isClearable
                  />
                </Field>
                <Field label="Tehsil (Sub-district)">
                  <Input value={(form as any).tehsil ?? ''} onChange={(e) => set('tehsil' as any, e.target.value as any)} placeholder="e.g., Srinagar City" />
                </Field>
              </div>

              {/* Row 2: Address - Full Width */}
              <Field label="Address">
                <Input value={(form as any).address ?? ''} onChange={(e) => set('address' as any, e.target.value as any)} placeholder="Full address or location description" />
              </Field>

              {/* Row 3: Coordinates Display (Read-only) + Boundary Warning */}
              <div className="space-y-3 mb-4">
                {form.lat && form.lng && (
                  (() => {
                    const lat = form.lat;
                    const lng = form.lng;
                    const kashmirBounds = { minLat: 32.8, maxLat: 37.5, minLng: 73.0, maxLng: 77.8 };
                    const padding = 0.5;
                    const nearBoundary =
                      lat < kashmirBounds.minLat + padding ||
                      lat > kashmirBounds.maxLat - padding ||
                      lng < kashmirBounds.minLng + padding ||
                      lng > kashmirBounds.maxLng - padding;

                    return nearBoundary ? (
                      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
                        <span className="text-lg">⚠️</span>
                        <div>
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">Near Region Boundary</p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                            This location is close to the Kashmir region boundary. Please verify coordinates are correct.
                          </p>
                        </div>
                      </div>
                    ) : null;
                  })()
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Latitude</label>
                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{form.lat?.toFixed(4) ?? '—'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Longitude</label>
                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{form.lng?.toFixed(4) ?? '—'}</div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 uppercase">Distance</label>
                    <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{form.distance_from_srinagar_km ?? '—'} km</div>
                  </div>
                </div>
              </div>

              {/* Row 4: Altitude & Distance */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Altitude (meters)">
                  <Input
                    type="number"
                    className="font-mono"
                    value={form.altitude_m ?? ''}
                    onChange={(e) => set('altitude_m', parseInt(e.target.value) as any)}
                    placeholder="e.g., 1590"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Elevation above sea level</p>
                </Field>
                <Field label="Distance from Srinagar (km)">
                  <Input
                    type="number"
                    className="font-mono"
                    value={form.distance_from_srinagar_km ?? ''}
                    onChange={(e) => set('distance_from_srinagar_km', parseInt(e.target.value) as any)}
                    placeholder="e.g., 52"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Auto-calculated when map is adjusted</p>
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. CATEGORIES & ACTIVITIES */}
        <Section title="Categories">
          {allCats.length === 0 ? (
            <p className="text-xs text-ink-3 italic">Loading…</p>
          ) : (
            <ToggleGrid value={(form.categories ?? []).filter(Boolean)} options={allCats.map((c) => ({ id: c.slug, label: c.name, color: c.color }))} onChange={(v) => set('categories', v)} />
          )}
        </Section>

        <Section title="Activities">
          <ToggleGrid
            value={(form.activities ?? []).filter(Boolean)}
            options={[
              { id: 'trekking', label: 'Trekking', color: '#2D6A4F' },
              { id: 'sightseeing', label: 'Sightseeing', color: '#2A5266' },
              { id: 'boating', label: 'Boating', color: '#4A8FB5' },
              { id: 'skiing', label: 'Skiing', color: '#EDF2F5' },
              { id: 'snowboarding', label: 'Snowboarding', color: '#B8C9D4' },
              { id: 'bird-watching', label: 'Bird watching', color: '#2D6A4F' },
              { id: 'camping', label: 'Camping', color: '#8B4513' },
              { id: 'photography', label: 'Photography', color: '#C9A227' },
              { id: 'fishing', label: 'Fishing', color: '#4A8FB5' },
              { id: 'heritage-walk', label: 'Heritage walk', color: '#C72D3D' },
              { id: 'river-rafting', label: 'River rafting', color: '#1F4788' },
              { id: 'gondola', label: 'Gondola', color: '#2A5266' },
              { id: 'golf', label: 'Golf', color: '#2D6A4F' },
              { id: 'horse-riding', label: 'Horse riding', color: '#8B4513' },
              { id: 'shopping', label: 'Shopping', color: '#D97444' },
            ]}
            onChange={(v) => set('activities', v)}
          />
        </Section>

        <Section title="Trail Features">
          <ToggleGrid
            value={((form as any).features ?? []).filter(Boolean)}
            options={TRAIL_FEATURES.map((f) => ({ id: f.id, label: f.label, color: undefined }))}
            onChange={(v) => set('features' as any, v as any)}
            cols={3}
          />
          <p className="text-[11px] text-ink-3 mt-3">Powers the AllTrails-style filter on mobile Explore screen.</p>
        </Section>

        {/* 5. ACCESS & LOGISTICS */}
        <Section title="Access & Season">
          <Field label="Season Type">
            <Select options={SEASON_OPTIONS} value={form.season_type ?? ''} onChange={(v) => set('season_type', v)} placeholder="Select..." />
          </Field>
          <Field label="Best Months">
            <div className="flex flex-wrap gap-3">
              {MONTHS.map((m, i) => {
                const month = i + 1;
                const active = form.best_months?.includes(month);
                return (
                  <button
                    key={m}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      active
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md hover:shadow-lg hover:bg-purple-700'
                        : 'bg-white dark:bg-slate-800 text-ink-2 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      const months = form.best_months ?? [];
                      set('best_months', active ? months.filter((x) => x !== month) : [...months, month].sort((a, b) => a - b));
                    }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </Field>
        </Section>

        <Section title="Entry Fees">
          <Checkbox label="Charges entry fee" checked={form.has_entry_fee ?? false} onChange={(v) => set('has_entry_fee', v as any)} />
          {form.has_entry_fee && (
            <div className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Local Visitors (INR)</label>
                <Input type="number" className="font-mono" value={form.entry_fee_inr ?? 0} onChange={(e) => set('entry_fee_inr', parseInt(e.target.value) as any)} placeholder="Amount in INR" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Foreign Visitors (INR)</label>
                <Input type="number" className="font-mono" value={(form as any).entry_fee_foreign_inr ?? 0} onChange={(e) => set('entry_fee_foreign_inr' as any, parseInt(e.target.value) as any)} placeholder="Foreign visitor fee (INR)" />
              </div>
            </div>
          )}
          <p className="text-[10px] text-ink-3 mt-2">Leave unchecked for free entry — the mobile app hides the fee entirely.</p>
        </Section>

        <Section title="Permits Required">
          <Checkbox label="Permit required to visit" checked={form.requires_permit ?? false} onChange={(v) => set('requires_permit', v as any)} />
          {form.requires_permit && (
            <div className="mt-3">
              <MultiSelect options={allPermits.map((p) => ({ value: p.slug, label: p.name }))} value={form.permits ?? []} onChange={(v) => set('permits', v as any)} placeholder="Select permits…" />
            </div>
          )}
          <p className="text-[10px] text-ink-3 mt-2">Leave unchecked where no permit is needed — the mobile app hides the permit note.</p>
        </Section>

        {/* 6. FACILITIES & CONNECTIVITY */}
        <Section title="Facilities & Infrastructure">
          <div className="space-y-4">
            <Checkbox label="ATM available" checked={(form.practical as any)?.atm ?? false} onChange={(v) => set('practical', { ...((form.practical ?? {}) as any), atm: v } as any)} />
            <Checkbox label="Drone allowed" checked={(form.practical as any)?.drone ?? false} onChange={(v) => set('practical', { ...((form.practical ?? {}) as any), drone: v } as any)} accent="chinar" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Fuel Station (km away)</label>
                <Input type="number" className="font-mono" value={(form.practical as any)?.fuel_km ?? ''} onChange={(e) => set('practical', { ...((form.practical ?? {}) as any), fuel_km: parseInt(e.target.value) || undefined } as any)} placeholder="Distance in km" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Toilet</label>
                <Select options={TOILET_OPTIONS} value={(form.practical as any)?.toilet ?? ''} onChange={(v) => set('practical', { ...((form.practical ?? {}) as any), toilet: v || undefined } as any)} placeholder="Unknown" />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Network Coverage">
          {(['jio', 'airtel', 'bsnl', 'vi'] as const).map((op) => (
            <div key={op} className="flex items-center gap-3 py-2">
              <span className="text-sm font-semibold w-16 uppercase text-slate-700 dark:text-slate-300">{op}</span>
              <div className="flex-1">
                <Select options={COVERAGE_OPTIONS} value={(form.network_coverage as any)?.[op] ?? ''} onChange={(v) => set('network_coverage', { ...((form.network_coverage ?? {}) as any), [op]: v || undefined } as any)} placeholder="Auto" />
              </div>
            </div>
          ))}
        </Section>

        {/* 7. OPERATIONS */}
        <Section title="Operations & Safety">
          <Field label="Open hours">
            <PairRows
              rows={Array.isArray(form.open_hours) ? form.open_hours : []}
              onChange={(rows) => set('open_hours', rows as any)}
              keyA="label" keyB="hours"
              placeholderA="When (e.g., Apr–Oct)" placeholderB="Hours (e.g., 06:00–19:00)"
            />
            <p className="text-[10px] text-ink-3 mt-1">One row per schedule. Leave empty if always open.</p>
          </Field>
          <Field label="Closure dates">
            <DateList
              dates={Array.isArray(form.closure_dates) ? form.closure_dates : []}
              onChange={(d) => set('closure_dates', d as any)}
            />
            <p className="text-[10px] text-ink-3 mt-1">Specific dates the destination is closed.</p>
          </Field>
          <Field label="Emergency contacts">
            <PairRows
              rows={Array.isArray(form.emergency_contacts) ? form.emergency_contacts : []}
              onChange={(rows) => set('emergency_contacts', rows as any)}
              keyA="label" keyB="phone"
              placeholderA="Label (e.g., Police)" placeholderB="Phone (e.g., +91-1948-234567)"
            />
            <p className="text-[10px] text-ink-3 mt-1">Local emergency numbers shown to travelers.</p>
          </Field>
        </Section>

        {/* 8. PUBLISHING & STATUS */}
        <Section title="Publishing & Status">
          <div className="space-y-4">
            <Checkbox label="Published" checked={form.is_published ?? false} onChange={(v) => set('is_published', v)} />
            <Checkbox label="Featured" checked={form.is_featured ?? false} onChange={(v) => set('is_featured', v)} accent="saffron" />
          </div>
        </Section>

        {/* READ-ONLY STATS */}
        {!isNew && (
          <Section title="Statistics (Read-only)">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400">{form.rating?.toFixed(1) ?? '—'}</div>
                <div className="text-[10px] tracking-wider text-slate-600 dark:text-slate-400 mt-2 font-semibold">RATING</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-3xl font-mono font-bold text-purple-600 dark:text-purple-400">
                  {form.review_count?.toLocaleString('en-IN') ?? '—'}
                </div>
                <div className="text-[10px] tracking-wider text-slate-600 dark:text-slate-400 mt-2 font-semibold">REVIEWS</div>
              </div>
            </div>
          </Section>
        )}
      </div>
    </>
  );
}

function slugify(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Editable list of two-field rows (label + value), used for open hours and emergency contacts. */
function PairRows({
  rows, onChange, keyA, keyB, placeholderA, placeholderB,
}: {
  rows: Record<string, string>[];
  onChange: (rows: Record<string, string>[]) => void;
  keyA: string;
  keyB: string;
  placeholderA: string;
  placeholderB: string;
}) {
  const update = (i: number, k: string, v: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const add = () => onChange([...rows, { [keyA]: '', [keyB]: '' }]);
  const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input className="flex-1" value={r[keyA] ?? ''} onChange={(e) => update(i, keyA, e.target.value)} placeholder={placeholderA} />
          <Input className="flex-1" value={r[keyB] ?? ''} onChange={(e) => update(i, keyB, e.target.value)} placeholder={placeholderB} />
          <button type="button" aria-label="Remove row" onClick={() => remove(i)} className="px-2 py-2 rounded text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">+ Add</button>
    </div>
  );
}

/** Editable list of ISO dates (YYYY-MM-DD), used for closure dates (DATE[] column). */
function DateList({ dates, onChange }: { dates: string[]; onChange: (dates: string[]) => void }) {
  const update = (i: number, v: string) => onChange(dates.map((d, idx) => (idx === i ? v : d)));
  const add = () => onChange([...dates, '']);
  const remove = (i: number) => onChange(dates.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {dates.map((d, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input type="date" className="flex-1" value={d ?? ''} onChange={(e) => update(i, e.target.value)} />
          <button type="button" aria-label="Remove date" onClick={() => remove(i)} className="px-2 py-2 rounded text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30">✕</button>
        </div>
      ))}
      <button type="button" onClick={add} className="px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700">+ Add date</button>
    </div>
  );
}
