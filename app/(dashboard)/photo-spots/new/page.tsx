'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { photoSpots, destinations, type PhotoSpot } from '@/lib/api';

const BEST_TIMES = ['sunrise', 'golden-pm', 'blue-hour', 'dawn', 'night'] as const;

export default function NewPhotoSpot() {
  const router = useRouter();
  const { data: dests } = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });
  const [form, setForm] = useState<Partial<PhotoSpot>>({ name: '', destination_slug: '', best_time: 'sunrise', facing: '', lat: 0, lng: 0 });
  const set = <K extends keyof PhotoSpot>(k: K, v: PhotoSpot[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useMutation({
    mutationFn: () => photoSpots.create(form),
    onSuccess: () => router.push('/photo-spots'),
  });

  return (
    <>
      <PageHeader
        title="New Photo Spot"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/photo-spots')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} /></div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Destination</label>
              <select className="input" value={form.destination_slug ?? ''} onChange={(e) => set('destination_slug', e.target.value)}>
                <option value="">Select...</option>
                {dests?.map((d) => <option key={d.id} value={d.slug}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Best time</label>
              <select className="input" value={form.best_time} onChange={(e) => set('best_time', e.target.value as any)}>
                {BEST_TIMES.map((t) => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Facing</label><input className="input" value={form.facing ?? ''} onChange={(e) => set('facing', e.target.value)} placeholder="NE" /></div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Lat, Lng</label><div className="flex gap-1"><input className="input flex-1" type="number" step="0.0001" value={form.lat ?? ''} onChange={(e) => set('lat', parseFloat(e.target.value) as any)} placeholder="34.0" /><input className="input flex-1" type="number" step="0.0001" value={form.lng ?? ''} onChange={(e) => set('lng', parseFloat(e.target.value) as any)} placeholder="74.8" /></div></div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.tripod_recommended ?? false} onChange={(e) => set('tripod_recommended', e.target.checked)} className="accent-dal w-4 h-4" /><span className="text-sm">Tripod recommended</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.drone_allowed ?? false} onChange={(e) => set('drone_allowed', e.target.checked)} className="accent-chinar w-4 h-4" /><span className="text-sm">Drone allowed</span></label>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} /></div>
        </div>
      </div>
    </>
  );
}
