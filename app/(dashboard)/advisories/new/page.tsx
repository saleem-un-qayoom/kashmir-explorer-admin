'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { advisories } from '@/lib/api';

export default function NewAdvisory() {
  const router = useRouter();
  const [severity, setSeverity] = useState('warning');
  const [category, setCategory] = useState('road');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [affected, setAffected] = useState('');
  const [source, setSource] = useState('JKTDC');

  const create = useMutation({
    mutationFn: () => advisories.create({ severity, category, title, body, affected, source, valid_hours: 48 } as any),
    onSuccess: () => router.push('/advisories'),
  });

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <label className="block">
        <span className="font-mono text-[10px] tracking-wider text-ink-3 block mb-1">{label.toUpperCase()}</span>
        {children}
      </label>
    );
  }

  return (
    <>
      <PageHeader
        title="Publish Advisory"
        subtitle="Live-pushed to every connected mobile client"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/advisories')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => create.mutate()} disabled={create.isPending || !title}>
              {create.isPending ? 'Publishing...' : 'Publish & push'}
            </button>
          </div>
        }
      />
      <div className="p-8 max-w-lg">
        <div className="card p-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Severity">
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
                <option value="road">Road</option>
                <option value="weather">Weather</option>
                <option value="avalanche">Avalanche</option>
                <option value="security">Security</option>
                <option value="health">Health</option>
              </select>
            </Field>
          </div>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm" placeholder="e.g. Razdan Pass closed" />
          </Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Affected areas, expected duration…" />
          </Field>
          <Field label="Affected area">
            <input value={affected} onChange={(e) => setAffected(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm" placeholder="Bandipora → Gurez Valley" />
          </Field>
          <Field label="Source">
            <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
              <option>JKTDC</option>
              <option>IMD</option>
              <option>NDMA</option>
              <option>Admin</option>
            </select>
          </Field>
        </div>
      </div>
    </>
  );
}
