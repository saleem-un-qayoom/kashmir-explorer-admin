'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { regions, type Region } from '@/lib/api';

export default function RegionsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['regions'], queryFn: regions.list });
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState<Region | null>(null);
  const del = useMutation({ mutationFn: (id: string) => regions.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }) });

  return (
    <>
      <PageHeader title="Regions" subtitle={`${data?.length ?? 0} regions`} action={<button className="btn btn-primary" onClick={() => router.push('/regions/new')}>+ New region</button>} />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Name</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Slug</th><th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Description</th><th></th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>}
              {data?.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-semibold">{r.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-3">{r.slug}</td>
                  <td className="px-4 py-3 text-ink-2 text-xs">{r.description ?? '—'}</td>
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
      {show && <RegionModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

function RegionModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: Region | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Region>>(initial ?? { name: '', slug: '' });
  const save = useMutation({
    mutationFn: () => initial ? regions.update(initial.id, form) : regions.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regions'] }); onClose(); },
  });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-xl font-bold mb-4">{initial ? 'Edit' : 'New'} Region</h2>
        <div className="space-y-3">
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Slug</label><input className="input font-mono" value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>{save.isPending ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
