'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';
import { roadStatus } from '@/lib/api';

const STATUS_CONFIG: Record<string, { label: string; pill: string; desc: string }> = {
  open: { label: 'OPEN', pill: 'pill-success', desc: 'Road is open and operational.' },
  'one-way': { label: 'ONE WAY', pill: 'pill-warning', desc: 'Traffic is moving in one direction only.' },
  closed: { label: 'CLOSED', pill: 'pill-danger', desc: 'Road is closed to all traffic.' },
  restricted: { label: 'RESTRICTED', pill: 'pill-info', desc: 'Access is restricted or requires permits.' },
};

export default function RoadStatusView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['road-status', id],
    queryFn: () => roadStatus.adminGet(id),
  });

  if (isLoading) return <div className="p-12 text-center text-ink-2 font-quote italic">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-ink-2 font-quote italic">Not found.</div>;

  const d = data;
  const cfg = STATUS_CONFIG[d.status] ?? { label: d.status.toUpperCase(), pill: 'pill-neutral', desc: '' };

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/road-status')}>Back to list</button>
            <button className="btn btn-primary" onClick={() => router.push(`/road-status/${id}`)}>Edit</button>
          </div>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Status">
            <div className="flex items-center gap-4 p-4 bg-pashmina/40 rounded-card mb-4">
              <span className={`pill text-sm ${cfg.pill}`}>{cfg.label}</span>
              <span className="text-sm text-ink-2">{cfg.desc}</span>
            </div>
            {d.closure_reason && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Closure reason</label>
                <p className="text-sm leading-relaxed bg-white border border-line rounded-card p-4">{d.closure_reason}</p>
              </div>
            )}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Timeline">
            <Row label="Last checked" value={new Date(d.last_checked).toLocaleString('en-IN')} />
            <Row label="Status" value={cfg.label} />
            <Row label="Slug" value={d.slug} mono />
          </Section>
        </div>
      </div>
    </>
  );
}
