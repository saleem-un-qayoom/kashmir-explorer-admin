'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';
import { regions } from '@/lib/api';

export default function RegionView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['region', id],
    queryFn: () => regions.adminGet(id),
  });

  if (isLoading) return <div className="p-12 text-center text-ink-2 font-quote italic">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-ink-2 font-quote italic">Not found.</div>;

  const d = data;

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/regions')}>Back to list</button>
            <button className="btn btn-primary" onClick={() => router.push(`/regions/${id}`)}>Edit</button>
          </div>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="p-4 bg-pashmina/40 rounded-card">
              <div className="text-2xl font-semibold">{d.name}</div>
              <div className="font-mono text-sm text-ink-3 mt-1">{d.slug}</div>
            </div>
            {d.description && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Description</label>
                <p className="text-sm leading-relaxed whitespace-pre-wrap bg-white border border-line rounded-card p-4">{d.description}</p>
              </div>
            )}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Metadata">
            <Row label="Slug" value={d.slug} mono />
            <Row label="ID" value={d.id} mono />
          </Section>
        </div>
      </div>
    </>
  );
}
