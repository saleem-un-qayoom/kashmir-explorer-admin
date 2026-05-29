'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input, Textarea, Select, Checkbox } from '@/components/FormControls';
import { MapView } from '@/components/MapView';
import { photoSpots, destinations } from '@/lib/api';

const BEST_TIMES = ['sunrise', 'golden-pm', 'blue-hour', 'dawn', 'night'] as const;

const BEST_TIME_OPTIONS = BEST_TIMES.map((t) => ({
  value: t,
  label: t.replace('-', ' '),
}));

const BEST_TIME_LABELS: Record<string, string> = {
  sunrise: '🌅',
  'golden-pm': '🌇',
  'blue-hour': '🌆',
  dawn: '🌄',
  night: '🌙',
};

export default function PhotoSpotEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data } = useQuery({
    queryKey: ['photo-spot', id],
    queryFn: () => photoSpots.get(id),
    enabled: !isNew,
  });

  const { data: dests } = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });

  const [form, setForm] = useState({
    name: '', destination_slug: '', best_time: 'sunrise' as typeof BEST_TIMES[number],
    facing: '', lat: 0, lng: 0, tripod_recommended: false, drone_allowed: false, description: '',
  });

  useEffect(() => {
    if (data) setForm({
      name: data.name, destination_slug: data.destination_slug, best_time: data.best_time,
      facing: data.facing, lat: data.lat, lng: data.lng,
      tripod_recommended: data.tripod_recommended, drone_allowed: data.drone_allowed,
      description: data.description ?? '',
    });
  }, [data]);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => isNew ? photoSpots.create(form) : photoSpots.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['photo-spots'] }); router.push('/photo-spots'); },
  });

  const destOptions = (dests ?? []).map((d) => ({ value: d.slug, label: d.name }));

  return (
    <>
      <PageHeader
        title={isNew ? 'New Photo Spot' : `Edit: ${form.name}`}
        subtitle={isNew ? 'Add a new photography location' : form.destination_slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/photo-spots')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
            </button>
          </div>
        }
      />
      {save.isError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {(save.error as Error).message}
        </div>
      )}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Spot Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Nigeen Lake Point" />
              </Field>
              <Field label="Destination">
                <Select options={destOptions} value={form.destination_slug} onChange={(v) => set('destination_slug', v)} placeholder="Select…" />
              </Field>
            </div>
          </Section>
          <Section title="Photography">
            <div className="grid grid-cols-3 gap-4">
              <Field label="Best time">
                <Select options={BEST_TIME_OPTIONS} value={form.best_time} onChange={(v) => set('best_time', v as any)} />
              </Field>
              <Field label="Facing">
                <Input value={form.facing} onChange={(e) => set('facing', e.target.value)} placeholder="NE" />
                <p className="text-[10px] text-ink-3 mt-1">Compass direction the camera faces</p>
              </Field>
              <Field label="Tripod">
                <Checkbox label="Recommended" checked={form.tripod_recommended} onChange={(v) => set('tripod_recommended', v)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Latitude">
                <Input type="number" step="0.0001" className="font-mono" value={form.lat} onChange={(e: any) => set('lat', parseFloat(e.target.value) as any)} />
              </Field>
              <Field label="Longitude">
                <Input type="number" step="0.0001" className="font-mono" value={form.lng} onChange={(e: any) => set('lng', parseFloat(e.target.value) as any)} />
              </Field>
            </div>
            <Field label="Drone">
              <Checkbox label="Allowed" checked={form.drone_allowed} onChange={(v) => set('drone_allowed', v)} />
            </Field>
          </Section>
          <Section title="Description">
            <Field label="Notes">
              <Textarea className="min-h-[120px]" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe the photo spot — best angles, tips, what to capture…" />
            </Field>
          </Section>
        </div>

        {/* Preview card */}
        <div className="space-y-6">
          <Section title="At a Glance">
            <div className="p-4 bg-pashmina/40 rounded-card space-y-3">
              <div className="text-center">
                <div className="text-4xl">{BEST_TIME_LABELS[form.best_time] ?? '📸'}</div>
                <div className="font-semibold text-lg mt-2">{form.name || 'Spot name'}</div>
                <div className="font-mono text-xs text-ink-3">{form.destination_slug}</div>
              </div>
              <div className="flex justify-center gap-2 pt-2 border-t border-line">
                <span className="pill pill-saffron text-[10px]">{form.best_time.replace('-', ' ')}</span>
                {form.facing && <span className="pill pill-neutral text-[10px]">{form.facing}</span>}
                {form.tripod_recommended && <span className="badge badge-success text-[10px]">TRIPOD</span>}
                {form.drone_allowed && <span className="badge badge-success text-[10px]">DRONE</span>}
              </div>
            </div>
            {form.lat !== 0 && form.lng !== 0 && (
              <div className="text-center text-[10px] text-ink-3 font-mono">
                {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
              </div>
            )}
          </Section>
        </div>
      </div>

      <div className="px-8 pb-8">
        <Section title="Map">
          <MapView
            lat={form.lat || null}
            lng={form.lng || null}
            onMove={(lat, lng) => { set('lat', lat as any); set('lng', lng as any); }}
            height={500}
          />
        </Section>
      </div>
    </>
  );
}
