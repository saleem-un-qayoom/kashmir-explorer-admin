'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Input, Textarea, Select } from '@/components/FormControls';
import { providers, type Provider } from '@/lib/api';

const TYPE_OPTIONS = [
  { value: 'guide', label: 'guide' },
  { value: 'houseboat', label: 'houseboat' },
  { value: 'shikara', label: 'shikara' },
  { value: 'cab', label: 'cab' },
  { value: 'pony', label: 'pony' },
  { value: 'helicopter', label: 'helicopter' },
];

const PRICE_UNIT_OPTIONS = [
  { value: 'per-person', label: 'per person' },
  { value: 'per-night', label: 'per night' },
  { value: 'per-day', label: 'per day' },
  { value: 'per-trip', label: 'per trip' },
];

export default function ProvidersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['providers'], queryFn: providers.list });
  const [edit, setEdit] = useState<Provider | null>(null);
  const [show, setShow] = useState(false);

  const verify = useMutation({
    mutationFn: (id: string) => providers.verify(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => providers.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });

  return (
    <>
      <PageHeader
        title="Providers"
        subtitle={`${data?.length ?? 0} listed · ${data?.filter((p) => p.verified).length ?? 0} JKTDC-verified`}
        action={<button className="btn btn-primary" onClick={() => { setEdit(null); setShow(true); }}>+ New provider</button>}
      />
      <div className="p-8 grid grid-cols-2 gap-4">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {data?.map((p) => (
          <div key={p.id} className="card p-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">
                {p.type === 'houseboat' ? '🛶' : p.type === 'shikara' ? '🚣' : p.type === 'guide' ? '🥾' : p.type === 'pony' ? '🐎' : p.type === 'cab' ? '🚕' : '🚁'}
              </span>
              <div className="flex-1">
                <div className="font-semibold">{p.name}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-0.5 tracking-wide">{p.type.toUpperCase()}</div>
              </div>
              {p.verified ? (
                <span className="badge badge-sapphire">✓ VERIFIED</span>
              ) : (
                <button onClick={() => verify.mutate(p.id)} className="btn btn-secondary text-xs">Verify</button>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-ink-2">
              <span>★ {p.rating.toFixed(1)}</span>
              <span className="font-mono">₹{p.price_inr.toLocaleString('en-IN')} {p.price_unit.replace('-', ' ')}</span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-line">
              <button className="btn btn-ghost text-xs" onClick={() => { setEdit(p); setShow(true); }}>Edit</button>
              <button className="btn btn-ghost text-xs text-chinar" onClick={() => { if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id); }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {show && <ProviderModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

function ProviderModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: Provider | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Provider>>(initial ?? {
    name: '', type: 'guide', verified: false, rating: 0, review_count: 0, price_inr: 0, price_unit: 'per-person',
  });

  const set = <K extends keyof Provider>(key: K, val: Provider[K]) => setForm((f) => ({ ...f, [key]: val }));

  const save = useMutation({
    mutationFn: () => initial ? providers.update(initial.id, form) : providers.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['providers'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-sm tracking-wider text-ink-3 mb-4">{initial ? 'EDIT PROVIDER' : 'NEW PROVIDER'}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Name *</label>
              <Input value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Type</label>
              <Select options={TYPE_OPTIONS} value={form.type ?? 'guide'} onChange={(v) => set('type', v)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Location</label>
            <Input value={form.base_location_text ?? ''} onChange={(e) => set('base_location_text', e.target.value)} placeholder="Srinagar, Kashmir" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Price (INR)</label>
              <Input type="number" className="font-mono" value={form.price_inr ?? 0} onChange={(e) => set('price_inr', parseInt(e.target.value) as any)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Price unit</label>
              <Select options={PRICE_UNIT_OPTIONS} value={form.price_unit ?? 'per-person'} onChange={(v) => set('price_unit', v)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">JKTDC reg no.</label>
              <Input className="font-mono text-xs" value={form.jktdc_reg_no ?? ''} onChange={(e) => set('jktdc_reg_no', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Capacity</label>
              <Input type="number" className="font-mono" value={form.capacity ?? ''} onChange={(e) => set('capacity', (parseInt(e.target.value) || undefined) as any)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Description</label>
            <Textarea className="min-h-[80px]" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Languages (comma-separated)</label>
            <Input value={(form.languages ?? []).join(', ')} onChange={(e) => set('languages', e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as any)} placeholder="English, Hindi, Kashmiri" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Amenities (comma-separated)</label>
            <Input value={(form.amenities ?? []).join(', ')} onChange={(e) => set('amenities', e.target.value.split(',').map((s) => s.trim()).filter(Boolean) as any)} placeholder="Wi-Fi, Breakfast, Heater, Hot water" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Phone</label>
              <Input className="font-mono text-xs" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">WhatsApp</label>
              <Input className="font-mono text-xs" value={form.whatsapp ?? ''} onChange={(e) => set('whatsapp', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Years hosting</label>
              <Input type="number" className="font-mono" value={form.years_hosting ?? ''} onChange={(e) => set('years_hosting', (parseInt(e.target.value) || undefined) as any)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Response time (min)</label>
              <Input type="number" className="font-mono" value={form.response_time_min ?? ''} onChange={(e) => set('response_time_min', (parseInt(e.target.value) || undefined) as any)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Cancellation policy</label>
            <Textarea className="min-h-[60px]" value={form.cancellation ?? ''} onChange={(e) => set('cancellation', e.target.value)} />
          </div>
        </div>
        {save.isError && <p className="text-xs text-chinar mt-3">{(save.error as Error).message}</p>}
        <div className="flex gap-2 justify-end mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : initial ? 'Update' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
