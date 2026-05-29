'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { dishes, festivals, crafts, etiquette } from '@/lib/api';

const TABS = [
  { key: 'food', label: 'Food' },
  { key: 'festivals', label: 'Festivals' },
  { key: 'crafts', label: 'Crafts' },
  { key: 'etiquette', label: 'Etiquette' },
] as const;
const ETIQUETTE_CATS = ['mosque', 'wazwan', 'street', 'dress'] as const;

export default function NewCultural() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get('tab') ?? 'food';
  const [form, setForm] = useState<any>({});

  const save = useMutation({
    mutationFn: () => {
      if (tab === 'food') return dishes.create(form);
      if (tab === 'festivals') return festivals.create(form);
      if (tab === 'crafts') return crafts.create(form);
      return etiquette.create(form);
    },
    onSuccess: () => router.push('/cultural'),
  });

  return (
    <>
      <PageHeader
        title={`New ${tab}`}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/cultural')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="px-8 pt-5 flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => router.push(`/cultural/new?tab=${t.key}`)} className={`pill ${tab === t.key ? 'pill-saffron' : 'pill-neutral'}`}>{t.label}</button>
        ))}
      </div>
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
          {tab === 'food' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Name (Urdu)</label><input className="input" dir="rtl" value={form.name_urdu ?? ''} onChange={(e) => setForm({ ...form, name_urdu: e.target.value })} /></div>
              </div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Name (Kashmiri)</label><input className="input" value={form.name_kashmiri ?? ''} onChange={(e) => setForm({ ...form, name_kashmiri: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.vegetarian ?? false} onChange={(e) => setForm({ ...form, vegetarian: e.target.checked })} className="accent-dal w-4 h-4" /><span className="text-sm">Vegetarian</span></label>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Where to try</label><input className="input" value={form.where_to_try ?? ''} onChange={(e) => setForm({ ...form, where_to_try: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Price range</label><input className="input" value={form.price_range ?? ''} onChange={(e) => setForm({ ...form, price_range: e.target.value })} /></div>
              </div>
            </>
          )}
          {tab === 'festivals' && (
            <>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Month</label>
                  <select className="input" value={form.month ?? 1} onChange={(e) => setForm({ ...form, month: parseInt(e.target.value) })}>
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Duration</label><input className="input" value={form.duration ?? ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Region</label><input className="input" value={form.region ?? ''} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
              </div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </>
          )}
          {tab === 'crafts' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Origin</label><input className="input" value={form.origin ?? ''} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-ink-2 mb-1">Price</label><input className="input" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              </div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            </>
          )}
          {tab === 'etiquette' && (
            <>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Category</label>
                <select className="input" value={form.category ?? 'mosque'} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {ETIQUETTE_CATS.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Title</label><input className="input" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><label className="block text-xs font-medium text-ink-2 mb-1">Body</label><textarea className="input min-h-[80px]" value={form.body ?? ''} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
