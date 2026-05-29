'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';
import { categories } from '@/lib/api';

export default function CategoryView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categories.adminGet(id),
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
            <button className="btn btn-ghost" onClick={() => router.push('/categories')}>Back to list</button>
            <button className="btn btn-primary" onClick={() => router.push(`/categories/${id}`)}>Edit</button>
          </div>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="flex items-center gap-4 p-4 bg-pashmina/40 rounded-card">
              <span className="text-5xl">{d.icon ?? '📁'}</span>
              <div>
                <div className="text-2xl font-semibold">{d.name}</div>
                <div className="font-mono text-sm text-ink-3 mt-1">{d.slug}</div>
              </div>
            </div>
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Appearance">
            <Row label="Icon" value={d.icon} />
            {d.color && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-1">Color</label>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-8 h-8 rounded-card border border-line" style={{ backgroundColor: d.color }} />
                  <span className="font-mono text-sm text-ink-3">{d.color}</span>
                </div>
              </div>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
