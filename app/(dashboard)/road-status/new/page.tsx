'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { roadStatus, type RoadStatus } from '@/lib/api';

const STATUSES = ['open', 'one-way', 'closed', 'restricted'] as const;

export default function NewRoadStatus() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<RoadStatus>>({ name: '', slug: '', status: 'open', last_checked: new Date().toISOString() });
  const save = useMutation({
    mutationFn: () => roadStatus.create(form),
    onSuccess: () => router.push('/road-status'),
  });

  return (
    <>
      <PageHeader
        title="New Road"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/road-status')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
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
      </div>
    </>
  );
}
