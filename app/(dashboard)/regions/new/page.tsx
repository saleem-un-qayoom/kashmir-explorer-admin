'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { regions, type Region } from '@/lib/api';

export default function NewRegion() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Region>>({ name: '', slug: '' });
  const save = useMutation({
    mutationFn: () => regions.create(form),
    onSuccess: () => router.push('/regions'),
  });

  return (
    <>
      <PageHeader
        title="New Region"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/regions')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Slug</label><input className="input font-mono" value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Description</label><textarea className="input min-h-[60px]" value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </div>
    </>
  );
}
