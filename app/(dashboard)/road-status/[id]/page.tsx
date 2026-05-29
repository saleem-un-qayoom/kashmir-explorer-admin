'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input, Textarea, Select } from '@/components/FormControls';
import { roadStatus } from '@/lib/api';

const STATUSES = ['open', 'one-way', 'closed', 'restricted'] as const;

const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: s.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

const STATUS_CONFIG: Record<string, { pill: string; desc: string }> = {
  open: { pill: 'pill-success', desc: 'Road is open and operational.' },
  'one-way': { pill: 'pill-warning', desc: 'Traffic is moving in one direction only.' },
  closed: { pill: 'pill-danger', desc: 'Road is closed to all traffic.' },
  restricted: { pill: 'pill-info', desc: 'Access is restricted or requires permits.' },
};

export default function RoadStatusEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data } = useQuery({
    queryKey: ['road-status', id],
    queryFn: () => roadStatus.adminGet(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState({ name: '', slug: '', status: 'open' as typeof STATUSES[number], closure_reason: '' });

  useEffect(() => {
    if (data) setForm({ name: data.name, slug: data.slug, status: data.status, closure_reason: data.closure_reason ?? '' });
  }, [data]);

  const save = useMutation({
    mutationFn: () => isNew ? roadStatus.create(form) : roadStatus.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['road-status'] }); router.push('/road-status'); },
  });

  const cfg = STATUS_CONFIG[form.status] ?? { pill: 'pill-neutral', desc: '' };

  return (
    <>
      <PageHeader
        title={isNew ? 'New Road Status' : `Edit: ${form.name}`}
        subtitle={isNew ? 'Add a monitored road' : form.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/road-status')}>Cancel</button>
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
          <Section title="Road Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Srinagar–Leh Hwy" />
              </Field>
              <Field label="Slug">
                <Input className="font-mono text-sm" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="srinagar-leh-hwy" />
              </Field>
            </div>
            <Field label="Status">
              <Select options={STATUS_OPTIONS} value={form.status} onChange={(v) => setForm({ ...form, status: v as any })} />
            </Field>
            <Field label="Closure reason">
              <Textarea className="min-h-[100px]" value={form.closure_reason} onChange={(e) => setForm({ ...form, closure_reason: e.target.value })} placeholder="Avalanche, repairs, weather conditions…" />
            </Field>
          </Section>
        </div>

        {/* Status indicator */}
        <div className="space-y-6">
          <Section title="Current Status">
            <div className="p-6 bg-pashmina/40 rounded-card text-center space-y-3">
              <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${cfg.pill}`}>
                {form.status.toUpperCase().replace('-', ' ')}
              </span>
              <p className="text-xs text-ink-2">{cfg.desc}</p>
            </div>
            {form.closure_reason && (
              <div className="p-3 bg-chinar/5 border border-chinar/20 rounded-card">
                <div className="text-[10px] font-mono tracking-wider text-chinar mb-1">CLOSURE REASON</div>
                <p className="text-xs text-ink-2">{form.closure_reason}</p>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
