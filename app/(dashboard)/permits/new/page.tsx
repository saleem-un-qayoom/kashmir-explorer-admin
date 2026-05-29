'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { permits, type Permit } from '@/lib/api';

const STATUSES = ['open', 'seasonal', 'always'] as const;

export default function NewPermit() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Permit>>({ name: '', required: '', office: '', status: 'open', processing_days: '', cost_inr: '', validity: '', notes: '', official_url: '' });
  const save = useMutation({
    mutationFn: () => permits.create(form),
    onSuccess: () => router.push('/permits'),
  });

  return (
    <>
      <PageHeader
        title="New Permit"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/permits')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
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
      </div>
    </>
  );
}
