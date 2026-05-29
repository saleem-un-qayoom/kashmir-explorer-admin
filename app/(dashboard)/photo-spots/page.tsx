'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { photoSpots, destinations, type PhotoSpot } from '@/lib/api';

const BEST_TIMES = ['sunrise', 'golden-pm', 'blue-hour', 'dawn', 'night'] as const;

export default function PhotoSpotsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['photo-spots'], queryFn: photoSpots.list });
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<PhotoSpot | null>(null);
  const del = useMutation({ mutationFn: (id: string) => photoSpots.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['photo-spots'] }) });

  return (
    <>
      <PageHeader title="Photo Spots" subtitle={`${data?.length ?? 0} photography locations`} action={<button className="btn btn-primary" onClick={() => router.push('/photo-spots/new')}>+ New spot</button>} />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Name</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Best time</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Facing</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Tripod</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Drone</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>}
              {data?.map((s) => (
                <tr key={s.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="font-semibold">{s.name}</div><div className="font-mono text-[10px] text-ink-3">{s.destination_slug}</div></td>
                  <td className="px-4 py-3"><span className="pill pill-saffron">{s.best_time}</span></td>
                  <td className="px-4 py-3 text-xs">{s.facing}</td>
                  <td className="px-4 py-3">{s.tripod_recommended ? <span className="badge badge-success">YES</span> : <span className="badge badge-neutral">NO</span>}</td>
                  <td className="px-4 py-3">{s.drone_allowed ? <span className="badge badge-success">YES</span> : <span className="badge badge-danger">NO</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(s); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(s.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && <PhotoSpotModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

function PhotoSpotModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: PhotoSpot | null; onClose: () => void }) {
  const { data: dests } = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });
  const [form, setForm] = useState<Partial<PhotoSpot>>(initial ?? { name: '', destination_slug: '', best_time: 'sunrise', facing: '', lat: 0, lng: 0 });
  const set = <K extends keyof PhotoSpot>(k: K, v: PhotoSpot[K]) => setForm((f) => ({ ...f, [k]: v }));
  const save = useMutation({
    mutationFn: () => initial ? photoSpots.update(initial.id, form) : photoSpots.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['photo-spots'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl font-bold mb-4">{initial ? 'Edit' : 'New'} Photo Spot</h2>
        <div className="space-y-3">
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
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
