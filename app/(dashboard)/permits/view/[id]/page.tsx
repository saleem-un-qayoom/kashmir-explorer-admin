'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';
import { permits } from '@/lib/api';

const STATUS_COLORS: Record<string, string> = {
  always: 'pill-success',
  seasonal: 'pill-warning',
  open: 'pill-info',
  restricted: 'pill-danger',
};

export default function PermitView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['permit', id],
    queryFn: () => permits.adminGet(id),
  });

  if (isLoading) return <div className="p-12 text-center text-ink-2 font-quote italic">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-ink-2 font-quote italic">Not found.</div>;

  const d = data;

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.status.toUpperCase()}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/permits')}>Back to list</button>
            <button className="btn btn-primary" onClick={() => router.push(`/permits/${id}`)}>Edit</button>
          </div>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="flex items-center gap-3 mb-4">
              <span className={`pill ${STATUS_COLORS[d.status] ?? 'pill-neutral'}`}>{d.status.toUpperCase()}</span>
              <span className="text-sm text-ink-3">{d.required}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-pashmina/40 rounded-card">
                <div className="text-2xl font-mono font-bold text-dal">₹{d.cost_inr}</div>
                <div className="text-[10px] tracking-wider text-ink-3 mt-1">COST</div>
              </div>
              <div className="text-center p-4 bg-pashmina/40 rounded-card">
                <div className="text-2xl font-mono font-bold text-dal">{d.validity || '—'}</div>
                <div className="text-[10px] tracking-wider text-ink-3 mt-1">VALIDITY</div>
              </div>
              <div className="text-center p-4 bg-pashmina/40 rounded-card">
                <div className="text-2xl font-mono font-bold text-dal">{d.processing_days || '—'}</div>
                <div className="text-[10px] tracking-wider text-ink-3 mt-1">PROCESSING</div>
              </div>
            </div>
            <Row label="Office" value={d.office} />
          </Section>
          {(d.notes || d.official_url) && (
            <Section title="Additional Info">
              {d.notes && <Row label="Notes" value={d.notes} />}
              {d.official_url && (
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">Official URL</label>
                  <a href={d.official_url} target="_blank" rel="noopener noreferrer" className="text-sm text-dal underline underline-offset-2">{d.official_url}</a>
                </div>
              )}
            </Section>
          )}
        </div>
        <div className="space-y-6">
          <Section title="Summary">
            <Row label="Required for" value={d.required} />
            <Row label="Status" value={d.status} mono />
          </Section>
        </div>
      </div>
    </>
  );
}
