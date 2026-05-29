'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input } from '@/components/FormControls';
import { categories } from '@/lib/api';

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categories.adminGet(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState({ name: '', slug: '', icon: '', color: '#000000' });

  useEffect(() => {
    if (data) setForm({ name: data.name, slug: data.slug, icon: data.icon ?? '', color: data.color ?? '#000000' });
  }, [data]);

  const save = useMutation({
    mutationFn: () => isNew ? categories.create(form) : categories.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); router.push('/categories'); },
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'New Category' : `Edit: ${form.name}`}
        subtitle={isNew ? 'Add a new category' : form.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/categories')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name || !form.slug}>
              {save.isPending ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
            </button>
          </div>
        }
      />
      {save.isError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {(save.error as Error).message}
        </div>
      )}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Details">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alpine Lakes" />
              </Field>
              <Field label="Slug" required>
                <Input className="font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="alpine-lakes" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Icon">
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏔️" />
                <p className="text-[10px] text-ink-3 mt-1">Emoji or icon identifier used in the mobile app</p>
              </Field>
              <Field label="Color">
                <div className="flex gap-2 items-center">
                  <input type="color" className="h-10 w-16 rounded-btn border border-line cursor-pointer shrink-0" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                  <Input className="font-mono text-xs" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
                </div>
              </Field>
            </div>
          </Section>
        </div>

        {/* Preview card */}
        <div className="space-y-6">
          <Section title="Preview">
            <div className="flex flex-col items-center gap-3 p-6 bg-pashmina/40 rounded-card text-center">
              <span className="text-6xl">{form.icon || '📁'}</span>
              <div>
                <div className="font-semibold text-lg">{form.name || 'Category name'}</div>
                <div className="font-mono text-xs text-ink-3 mt-0.5">{form.slug || 'category-slug'}</div>
              </div>
              {form.color && (
                <div className="flex items-center gap-2 text-xs text-ink-3">
                  <span className="inline-block w-4 h-4 rounded-sm" style={{ backgroundColor: form.color }} />
                  {form.color}
                </div>
              )}
            </div>
            <p className="text-[10px] text-ink-3 text-center">How this category appears in the mobile app</p>
          </Section>
        </div>
      </div>
    </>
  );
}
