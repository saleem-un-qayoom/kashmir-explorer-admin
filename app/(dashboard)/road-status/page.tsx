'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { roadStatus, type RoadStatus } from '@/lib/api';

const STATUSES = ['open', 'one-way', 'closed', 'restricted'] as const;

export default function RoadStatusPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['road-status'], queryFn: roadStatus.list });
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<RoadStatus | null>(null);
  const del = useMutation({ mutationFn: (id: string) => roadStatus.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['road-status'] }) });

  const statusColor = (s: string) => s === 'open' ? 'pill-success' : s === 'one-way' ? 'pill-warning' : s === 'closed' ? 'pill-danger' : 'pill-info';

  return (
    <>
      <PageHeader title="Road Status" subtitle={`${data?.length ?? 0} monitored roads`} action={<button className="btn btn-primary" onClick={() => router.push('/road-status/new')}>+ New road</button>} />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Name</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Status</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Reason</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Last checked</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>}
              {data?.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3"><div className="font-semibold">{r.name}</div><div className="font-mono text-[10px] text-ink-3">{r.slug}</div></td>
                  <td className="px-4 py-3"><span className={`pill ${statusColor(r.status)}`}>{r.status.toUpperCase().replace('-', ' ')}</span></td>
                  <td className="px-4 py-3 text-xs text-ink-2">{r.closure_reason ?? '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-3">{new Date(r.last_checked).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs" onClick={() => { setEdit(r); setShow(true); }}>Edit</button>
                    <button className="btn btn-ghost text-xs text-chinar" onClick={() => del.mutate(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {show && <RoadStatusModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

function RoadStatusModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: RoadStatus | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<RoadStatus>>(initial ?? { name: '', slug: '', status: 'open', last_checked: new Date().toISOString() });
  const save = useMutation({
    mutationFn: () => initial ? roadStatus.update(initial.id, form) : roadStatus.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['road-status'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl font-bold mb-4">{initial ? 'Edit' : 'New'} Road</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Srinagar–Leah Hwy" /></div>
            <div><label className="block text-xs font-medium text-ink-2 mb-1">Slug</label><input className="input font-mono" value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
              {STATUSES.map((s) => <option key={s} value={s}>{s.replace('-', ' ').charAt(0).toUpperCase() + s.replace('-', ' ').slice(1)}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Closure reason</label><input className="input" value={form.closure_reason ?? ''} onChange={(e) => setForm({ ...form, closure_reason: e.target.value })} placeholder="Avalanche, repairs…" /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
