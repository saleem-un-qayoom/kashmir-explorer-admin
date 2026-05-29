'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { permits, type Permit } from '@/lib/api';

export default function PermitsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['permits'], queryFn: permits.list });
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Permit | null>(null);
  const del = useMutation({ mutationFn: (id: string) => permits.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['permits'] }) });

  return (
    <>
      <PageHeader title="Permits" subtitle={`${data?.length ?? 0} permit types`} action={<button className="btn btn-primary" onClick={() => router.push('/permits/new')}>+ New permit</button>} />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Name</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Cost</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Office</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Status</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>}
              {data?.map((p) => (
                <tr key={p.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{p.name}</td>
                  <td className="px-4 py-3 font-mono">{p.cost_inr}</td>
                  <td className="px-4 py-3 text-xs text-ink-2">{p.office}</td>
                  <td className="px-4 py-3"><span className={`pill ${p.status === 'always' ? 'pill-success' : p.status === 'seasonal' ? 'pill-warning' : 'pill-info'}`}>{p.status.toUpperCase()}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(p); setShow(true); }}>Edit</button>

                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && <PermitModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

const STATUSES = ['open', 'seasonal', 'always'] as const;

function PermitModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: Permit | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Permit>>(initial ?? { name: '', required: '', office: '', status: 'open', processing_days: '', cost_inr: '', validity: '', notes: '', official_url: '' });
  const save = useMutation({
    mutationFn: () => initial ? permits.update(initial.id, form) : permits.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permits'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl font-bold mb-4">{initial ? 'Edit' : 'New'} Permit</h2>
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Required for</label><input className="input" value={form.required ?? ''} onChange={(e) => setForm({ ...form, required: e.target.value })} /></div>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Office</label><input className="input" value={form.office ?? ''} onChange={(e) => setForm({ ...form, office: e.target.value })} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Processing</label><input className="input" value={form.processing_days ?? ''} onChange={(e) => setForm({ ...form, processing_days: e.target.value })} placeholder="1-2 days" /></div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Cost (INR)</label><input className="input" value={form.cost_inr ?? ''} onChange={(e) => setForm({ ...form, cost_inr: e.target.value })} /></div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Validity</label><input className="input" value={form.validity ?? ''} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="30 days" /></div>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Notes</label><textarea className="input min-h-[60px]" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Official URL</label><input className="input font-mono text-xs" value={form.official_url ?? ''} onChange={(e) => setForm({ ...form, official_url: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
