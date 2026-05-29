'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';
import { MapView } from '@/components/MapView';
import { photoSpots } from '@/lib/api';

const BEST_TIME_LABELS: Record<string, string> = {
  sunrise: '🌅 Sunrise',
  'golden-pm': '🌇 Golden PM',
  'blue-hour': '🌆 Blue Hour',
  dawn: '🌄 Dawn',
  night: '🌙 Night',
};

export default function PhotoSpotView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['photo-spot', id],
    queryFn: () => photoSpots.get(id),
  });

  if (isLoading) return <div className="p-12 text-center text-ink-2 font-quote italic">Loading…</div>;
  if (!data) return <div className="p-12 text-center text-ink-2 font-quote italic">Not found.</div>;

  const d = data;

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.destination_slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/photo-spots')}>Back to list</button>
            <button className="btn btn-primary" onClick={() => router.push(`/photo-spots/${id}`)}>Edit</button>
          </div>
        }
      />
      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="p-4 bg-pashmina/40 rounded-card mb-4">
              <div className="text-2xl font-semibold">{d.name}</div>
              <div className="font-mono text-sm text-ink-3 mt-1">{d.destination_slug}</div>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="pill pill-saffron">{BEST_TIME_LABELS[d.best_time] ?? d.best_time}</span>
              <span className="pill pill-neutral">{d.facing ? `${d.facing} facing` : 'Facing —'}</span>
              {d.tripod_recommended ? <span className="badge badge-success">TRIPOD</span> : <span className="badge badge-neutral">NO TRIPOD</span>}
              {d.drone_allowed ? <span className="badge badge-success">DRONE OK</span> : <span className="badge badge-danger">NO DRONE</span>}
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
          <Section title="Location">
            <div className="grid grid-cols-2 gap-4">
              <Row label="Latitude" value={d.lat.toFixed(4)} mono />
              <Row label="Longitude" value={d.lng.toFixed(4)} mono />
            </div>
            {d.lat && d.lng && (
              <a
                href={`https://www.google.com/maps?q=${d.lat},${d.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-dal font-medium tracking-wide inline-flex items-center gap-1 mt-2"
              >
                ↗ Open in Google Maps
              </a>
            )}
          </Section>
        </div>
      </div>

      <div className="px-8 pb-8">
        <Section title="Map">
          <MapView lat={d.lat} lng={d.lng} height={450} />
        </Section>
      </div>
    </>
  );
}
