'use client';

import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Section, Field } from '@/components/FormFields';
import { Input, Textarea, Select } from '@/components/FormControls';
import { permits } from '@/lib/api';

const STATUSES = ['open', 'seasonal', 'always'] as const;

const STATUS_OPTIONS = STATUSES.map((s) => ({
  value: s,
  label: s.charAt(0).toUpperCase() + s.slice(1),
}));

const STATUS_PILL: Record<string, string> = {
  always: 'pill-success',
  seasonal: 'pill-warning',
  open: 'pill-info',
};

export default function PermitEdit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const isNew = id === 'new';

  const { data } = useQuery({
    queryKey: ['permit', id],
    queryFn: () => permits.adminGet(id),
    enabled: !isNew,
  });

  const [form, setForm] = useState({
    name: '', required: '', office: '', processing_days: '', cost_inr: '',
    validity: '', status: 'always' as typeof STATUSES[number], notes: '', official_url: '',
  });

  useEffect(() => {
    if (data) setForm({
      name: data.name, required: data.required, office: data.office,
      processing_days: data.processing_days, cost_inr: data.cost_inr,
      validity: data.validity, status: data.status, notes: data.notes ?? '',
      official_url: data.official_url ?? '',
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => isNew ? permits.create(form) : permits.update(id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['permits'] }); router.push('/permits'); },
  });

  return (
    <>
      <PageHeader
        title={isNew ? 'New Permit' : `Edit: ${form.name}`}
        subtitle={isNew ? 'Add a new permit type' : form.status.toUpperCase()}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/permits')}>Cancel</button>
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
          <Section title="Permit Info">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Name" required>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. ILP" />
              </Field>
              <Field label="Required for">
                <Input value={form.required} onChange={(e) => setForm({ ...form, required: e.target.value })} placeholder="Foreign nationals" />
              </Field>
            </div>
            <Field label="Office">
              <Input value={form.office} onChange={(e) => setForm({ ...form, office: e.target.value })} placeholder="DC Office, Srinagar" />
            </Field>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Processing">
                <Input value={form.processing_days} onChange={(e) => setForm({ ...form, processing_days: e.target.value })} placeholder="1-2 days" />
              </Field>
              <Field label="Cost (INR)">
                <Input className="font-mono" value={form.cost_inr} onChange={(e) => setForm({ ...form, cost_inr: e.target.value })} placeholder="500" />
                <p className="text-[10px] text-ink-3 mt-1">Displayed on the permit card</p>
              </Field>
              <Field label="Validity">
                <Input value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="30 days" />
              </Field>
            </div>
            <Field label="Status">
              <Select options={STATUS_OPTIONS} value={form.status} onChange={(v) => setForm({ ...form, status: v as any })} />
            </Field>
          </Section>
          <Section title="Additional">
            <Field label="Notes">
              <Textarea className="min-h-[80px]" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional information…" />
            </Field>
            <Field label="Official URL">
              <Input className="font-mono text-xs" value={form.official_url} onChange={(e) => setForm({ ...form, official_url: e.target.value })} placeholder="https://jk.gov.in/permits" />
            </Field>
          </Section>
        </div>

        {/* Cost summary card */}
        <div className="space-y-6">
          <Section title="Cost Breakdown">
            <div className="p-4 bg-pashmina/40 rounded-card space-y-3">
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-dal">
                  {form.cost_inr ? `₹${form.cost_inr}` : '₹—'}
                </div>
                <div className="text-[10px] tracking-wider text-ink-3 mt-1">COST</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center pt-3 border-t border-line">
                <div>
                  <div className="text-lg font-mono font-semibold">{form.validity || '—'}</div>
                  <div className="text-[10px] tracking-wider text-ink-3">VALIDITY</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-semibold">{form.processing_days || '—'}</div>
                  <div className="text-[10px] tracking-wider text-ink-3">PROCESSING</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <span className={`pill text-xs ${STATUS_PILL[form.status] ?? 'pill-neutral'}`}>
                {form.status.toUpperCase()}
              </span>
            </div>
          </Section>
        </div>
      </div>
    </>
  );
}
