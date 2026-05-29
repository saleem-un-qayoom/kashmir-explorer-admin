'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input, Textarea } from '@/components/FormControls';
import { regions } from '@/lib/api';

export default function RegionEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regions.adminGet(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState({ name: '', slug: '', description: '' });

  useEffect(() => {
    if (data) setForm({ name: data.name, slug: data.slug, description: data.description ?? '' });
  }, [data]);

  const save = useMutation({
    mutationFn: () => isNew ? regions.create(form) : regions.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['regions'] }); router.push('/regions'); },
  });

  const charCount = form.description.length;

  return (
    <>
      <PageHeader
        title={isNew ? 'New Region' : `Edit: ${form.name}`}
        subtitle={isNew ? 'Add a new region' : form.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/regions')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || !form.name}>
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
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Kashmir Valley" />
              </Field>
              <Field label="Slug">
                <Input className="font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="kashmir-valley" />
              </Field>
            </div>
            <Field label="Description">
              <Textarea className="min-h-[120px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the region — geography, highlights, access…" />
              <p className="text-[10px] text-ink-3 mt-1 text-right">{charCount} characters</p>
            </Field>
          </Section>
        </div>

        {/* Summary card */}
        <div className="space-y-6">
          <Section title="Summary">
            <div className="p-4 bg-pashmina/40 rounded-card">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🗺️</span>
                <div>
                  <div className="font-semibold text-lg">{form.name || 'Region name'}</div>
                  <div className="font-mono text-xs text-ink-3 mt-0.5">{form.slug || 'region-slug'}</div>
                </div>
              </div>
              {form.description && (
                <p className="text-xs text-ink-2 mt-3 line-clamp-3 leading-relaxed">{form.description}</p>
              )}
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
