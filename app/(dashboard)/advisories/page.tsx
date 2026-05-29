'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { Input, Textarea, Select } from '@/components/FormControls';
import { advisories, type Advisory } from '@/lib/api';
import { liveOps } from '@/lib/ws';

const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
];

export default function AdvisoriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['advisories'], queryFn: advisories.list });
  const router = useRouter();
  const [liveConnected, setLiveConnected] = useState(false);
  const [edit, setEdit] = useState<Advisory | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    liveOps.start();
    const unsub = liveOps.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['advisories'] });
      setLiveConnected(true);
    });
    return () => {
      unsub();
      liveOps.stop();
    };
  }, [qc]);

  const del = useMutation({
    mutationFn: (id: string) => advisories.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advisories'] }),
  });

  return (
    <>
      <PageHeader
        title="Advisories · Live Ops"
        subtitle={
          <span className="flex items-center gap-2">
            <span className={`inline-block w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald' : 'bg-amber'} animate-pulse`} />
            {liveConnected ? 'Live · pushing to mobile clients' : 'Connecting to live feed…'}
          </span>
        }
        action={
          <button className="btn btn-primary" onClick={() => router.push('/advisories/new')}>
            + Publish advisory
          </button>
        }
      />

      <div className="p-8 space-y-4">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {data?.map((a) => (
          <div
            key={a.id}
            className={`card p-5 border-l-4 ${
              a.severity === 'critical'
                ? 'border-l-chinar'
                : a.severity === 'warning'
                  ? 'border-l-amber'
                  : 'border-l-dal'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`pill ${
                  a.severity === 'critical'
                    ? 'pill-danger'
                    : a.severity === 'warning'
                      ? 'pill-warning'
                      : 'pill-info'
                }`}
              >
                {a.severity.toUpperCase()} · {a.category.toUpperCase()}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-lg">{a.title}</div>
                <div className="text-sm text-ink-2 mt-1">{a.body}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-2 tracking-wider flex items-center gap-1">
                  <MapPin size={12} weight="duotone" />
                  {a.affected?.toUpperCase()} · UNTIL {new Date(a.valid_until).toLocaleDateString('en-IN')}
                </div>
              </div>
              <span className="pill pill-neutral">{a.source}</span>
              <div className="flex gap-1">
                <button className="text-xs font-semibold text-dal" onClick={() => { setEdit(a); setShow(true); }}>
                  EDIT
                </button>
                <button onClick={() => del.mutate(a.id)} className="text-chinar text-xs font-semibold">
                  CLEAR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {show && <AdvisoryModal qc={qc} initial={edit} onClose={() => setShow(false)} />}
    </>
  );
}

function AdvisoryModal({ qc, initial, onClose }: { qc: ReturnType<typeof useQueryClient>; initial: Advisory | null; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Advisory>>(initial ?? {
    severity: 'info', category: '', title: '', body: '', source: '', affected: '', valid_until: '', confidence: 100,
  });

  const set = <K extends keyof Advisory>(key: K, val: Advisory[K]) => setForm((f) => ({ ...f, [key]: val }));

  const save = useMutation({
    mutationFn: () => initial ? advisories.update(initial.id, form) : advisories.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advisories'] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-sm tracking-wider text-ink-3 mb-4">{initial ? 'EDIT ADVISORY' : 'NEW ADVISORY'}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Title *</label>
            <Input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Severity</label>
              <Select options={SEVERITY_OPTIONS} value={form.severity} onChange={(v) => set('severity', v as Advisory['severity'])} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Category</label>
              <Input value={form.category ?? ''} onChange={(e) => set('category', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Body</label>
            <Textarea className="min-h-[80px]" value={form.body ?? ''} onChange={(e) => set('body', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Source</label>
              <Input value={form.source ?? ''} onChange={(e) => set('source', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Affected area</label>
              <Input value={form.affected ?? ''} onChange={(e) => set('affected', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Valid until</label>
              <Input type="date" className="font-mono text-xs" value={form.valid_until ?? ''} onChange={(e) => set('valid_until', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Confidence (%)</label>
              <Input type="number" className="font-mono" value={form.confidence ?? 100} onChange={(e) => set('confidence', parseInt(e.target.value) as any)} />
            </div>
          </div>
        </div>
        {save.isError && <p className="text-xs text-chinar mt-3">{(save.error as Error).message}</p>}
        <div className="flex gap-2 justify-end mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'Saving…' : initial ? 'Update' : 'Publish'}</button>
        </div>
      </div>
    </div>
  );
}
