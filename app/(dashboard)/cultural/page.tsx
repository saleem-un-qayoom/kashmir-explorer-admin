'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { dishes, festivals, crafts, etiquette, type Dish, type Festival, type Craft, type EtiquetteTip } from '@/lib/api';

const TABS = [
  { key: 'food', label: 'Food', queryKey: ['dishes'], useList: () => useQuery({ queryKey: ['dishes'], queryFn: dishes.list }), columns: ['Name', 'Urdu', 'Veg', 'Where', 'Price'] },
  { key: 'festivals', label: 'Festivals', queryKey: ['festivals'], useList: () => useQuery({ queryKey: ['festivals'], queryFn: festivals.list }), columns: ['Name', 'Month', 'Duration', 'Region'] },
  { key: 'crafts', label: 'Crafts', queryKey: ['crafts'], useList: () => useQuery({ queryKey: ['crafts'], queryFn: crafts.list }), columns: ['Name', 'Origin', 'Price'] },
  { key: 'etiquette', label: 'Etiquette', queryKey: ['etiquette'], useList: () => useQuery({ queryKey: ['etiquette'], queryFn: etiquette.list }), columns: ['Category', 'Title'] },
];

export default function CulturalPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState('food');
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const active = TABS.find((t) => t.key === tab)!;
  const { data, isLoading } = active.useList();

  const del = useMutation({
    mutationFn: (id: string) => {
      if (tab === 'food') return dishes.remove(id);
      if (tab === 'festivals') return festivals.remove(id);
      if (tab === 'crafts') return crafts.remove(id);
      return etiquette.remove(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [active.queryKey[0]] }),
  });

  return (
    <>
      <PageHeader title="Cultural" subtitle="Dishes, festivals, crafts, etiquette" action={<button className="btn btn-primary" onClick={() => router.push(`/cultural/new?tab=${tab}`)}>+ New {tab}</button>} />
      <div className="px-8 pt-5 flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pill ${tab === t.key ? 'pill-saffron' : 'pill-neutral'}`}>{t.label}</button>
        ))}
      </div>
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr>{active.columns.map((c) => <th key={c} className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">{c.toUpperCase()}</th>)}<th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={active.columns.length + 1} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>}
              {tab === 'food' && (data as Dish[] | undefined)?.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{item.name}{item.name_urdu && <span className="font-mono text-[10px] text-ink-3 ml-2" dir="rtl">{item.name_urdu}</span>}</td>
                  <td className="px-4 py-3 text-xs">{item.name_urdu ?? '—'}</td>
                  <td className="px-4 py-3">{item.vegetarian ? <span className="badge badge-success">VEG</span> : <span className="badge badge-danger">NON-VEG</span>}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{item.where_to_try}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.price_range}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(item); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {tab === 'festivals' && (data as Festival[] | undefined)?.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][item.month - 1]}</td>
                  <td className="px-4 py-3 text-xs">{item.duration}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{item.region}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(item); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {tab === 'crafts' && (data as Craft[] | undefined)?.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{item.name}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{item.origin}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.price}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(item); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {tab === 'etiquette' && (data as EtiquetteTip[] | undefined)?.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><span className="pill pill-neutral">{item.category.toUpperCase()}</span></td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(item); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(item.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && <CulturalModal tab={tab} qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

const ETIQUETTE_CATS = ['mosque', 'wazwan', 'street', 'dress'] as const;

function CulturalModal({ tab, qc, initial, onClose }: { tab: string; qc: ReturnType<typeof useQueryClient>; initial: any; onClose: () => void }) {
  const [form, setForm] = useState<any>(initial ?? {});
  const save = useMutation({
    mutationFn: () => {
      if (tab === 'food') return initial ? dishes.update(initial.id, form) : dishes.create(form);
      if (tab === 'festivals') return initial ? festivals.update(initial.id, form) : festivals.create(form);
      if (tab === 'crafts') return initial ? crafts.update(initial.id, form) : crafts.create(form);
      return initial ? etiquette.update(initial.id, form) : etiquette.create(form);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: [tab === 'food' ? 'dishes' : tab === 'festivals' ? 'festivals' : tab === 'crafts' ? 'crafts' : 'etiquette'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl font-bold mb-4">{initial ? 'Edit' : 'New'} {tab}</h2>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
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
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
