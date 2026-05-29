'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { categories, type Category } from '@/lib/api';

export default function NewCategory() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Category>>({ name: '', slug: '' });
  const save = useMutation({
    mutationFn: () => categories.create(form),
    onSuccess: () => router.push('/categories'),
  });

  return (
    <>
      <PageHeader
        title="New Category"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/categories')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.slug}>
              {save.isPending ? 'Saving...' : 'Create'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Name</label><input className="input" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Slug</label><input className="input font-mono" value={form.slug ?? ''} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Icon</label><input className="input" value={form.icon ?? ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
          <div><label className="block text-xs font-medium text-ink-2 mb-1">Color</label><input type="color" className="h-10 w-full rounded-btn border border-line cursor-pointer" value={form.color ?? '#000000'} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        </div>
      </div>
    </>
  );
}
