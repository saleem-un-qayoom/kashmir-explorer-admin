'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { destinations } from '@/lib/api';
import { MapView } from '@/components/MapView';
import { PageHeader } from '@/components/PageHeader';
import { Section, Row } from '@/components/FormFields';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_COLORS: Record<string, string> = {
  popular: 'bg-emerald-100 text-emerald-800',
  adventure: 'bg-orange-100 text-orange-800',
  nature: 'bg-green-100 text-green-800',
  cultural: 'bg-purple-100 text-purple-800',
  spiritual: 'bg-indigo-100 text-indigo-800',
  'hidden-gems': 'bg-amber-100 text-amber-800',
};

export default function DestinationView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['destination', id],
    queryFn: () => destinations.adminGet(id),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Loading destination…</div>;
  }
  if (!data) {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Destination not found.</div>;
  }

  const d = data;

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/destinations')}>
              Back to list
            </button>
            <button className="btn btn-primary" onClick={() => router.push(`/destinations/${id}`)}>
              Edit
            </button>
          </div>
        }
      />

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── Left column: hero + images ─── */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="space-y-4">
              <Row label="Name" value={d.name} />
              {d.name_urdu && <Row label="Name (Urdu)" value={d.name_urdu} />}
              {d.name_hindi && <Row label="Name (Hindi)" value={d.name_hindi} />}
              <Row label="Slug" value={d.slug} mono />
              {d.tagline && <Row label="Tagline" value={d.tagline} />}
              {d.uniqueness && <Row label="Uniqueness" value={d.uniqueness} />}
              {d.description && (
                <div>
                  <label className="block text-xs font-medium text-ink-2 mb-1">Description</label>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{d.description}</p>
                </div>
              )}
            </div>
          </Section>

          <Section title="Location">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-0">
              <Row label="Latitude" value={d.lat?.toFixed(4)} mono />
              <Row label="Longitude" value={d.lng?.toFixed(4)} mono />
              <Row label="Altitude (m)" value={d.altitude_m} mono />
              {d.distance_from_srinagar_km != null && (
                <Row label="Dist from Srinagar" value={`${d.distance_from_srinagar_km} km`} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Row label="Region" value={d.region_slug} />
              <Row label="District" value={d.district} />
            </div>
          </Section>

          <Section title="Season & Access">
            <div className="grid grid-cols-2 gap-4">
              <Row label="Season Type" value={d.season_type} />
              {d.entry_fee_inr != null && d.entry_fee_inr > 0 && (
                <Row label="Entry Fee" value={`₹${d.entry_fee_inr}`} />
              )}
            </div>
            {d.best_months && d.best_months.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-2">Best Months</label>
                <div className="flex flex-wrap gap-1.5">
                  {d.best_months.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-dal/10 text-dal border border-dal/20">
                      {MONTHS[m - 1]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.permits && d.permits.length > 0 && (
              <Row label="Permits" value={d.permits.join(', ')} />
            )}
          </Section>
        </div>

        {/* ─── Right column: meta / tags / practical ─── */}
        <div className="space-y-6">
          <Section title="Status">
            <div className="flex gap-3">
              {d.is_published ? (
                <span className="badge badge-success">Published</span>
              ) : (
                <span className="badge badge-neutral">Draft</span>
              )}
              {d.is_featured && <span className="badge badge-warning">Featured</span>}
            </div>
            {d.rating != null && (
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="text-center p-4 bg-pashmina/40 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-dal">{d.rating.toFixed(1)}</div>
                  <div className="text-[10px] tracking-wider text-ink-3 mt-1">RATING</div>
                </div>
                <div className="text-center p-4 bg-pashmina/40 rounded-lg">
                  <div className="text-2xl font-mono font-bold text-dal">
                    {d.review_count?.toLocaleString('en-IN') ?? '—'}
                  </div>
                  <div className="text-[10px] tracking-wider text-ink-3 mt-1">REVIEWS</div>
                </div>
              </div>
            )}
          </Section>

          <Section title="Categories">
            <div className="flex flex-wrap gap-1.5">
              {(d.categories ?? []).map((cat) => (
                <span key={cat} className={`px-3 py-1.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[cat] ?? 'bg-gray-100 text-gray-700'}`}>
                  {cat}
                </span>
              ))}
              {(!d.categories || d.categories.length === 0) && (
                <span className="text-xs text-ink-3 italic">None</span>
              )}
            </div>
          </Section>

          <Section title="Activities">
            <div className="flex flex-wrap gap-1.5">
              {(d.activities ?? []).map((act) => (
                <span key={act} className="px-2.5 py-1 rounded-full text-xs font-medium bg-dal/10 text-dal border border-dal/20">
                  {act.replace(/-/g, ' ')}
                </span>
              ))}
              {(!d.activities || d.activities.length === 0) && (
                <span className="text-xs text-ink-3 italic">None</span>
              )}
            </div>
          </Section>

          <Section title="Trail Features">
            <div className="flex flex-wrap gap-1.5">
              {(d.features ?? []).map((f) => (
                <span key={f} className="px-2.5 py-1 rounded-full text-xs font-medium bg-chinar/10 text-chinar border border-chinar/20">
                  {f.replace(/-/g, ' ')}
                </span>
              ))}
              {(!d.features || d.features.length === 0) && (
                <span className="text-xs text-ink-3 italic">None</span>
              )}
            </div>
          </Section>

          {d.network_coverage && (
            <Section title="Network Coverage">
              {Object.entries(d.network_coverage).map(([op, status]) => (
                status ? (
                  <div key={op} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-16 uppercase">{op}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      status === 'good' ? 'bg-green-100 text-green-700' :
                      status === 'patchy' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {status}
                    </span>
                  </div>
                ) : null
              ))}
            </Section>
          )}

          {d.practical && (
            <Section title="Practical Info">
              {(d.practical as any)?.atm && <Row label="ATM" value="Available" />}
              {(d.practical as any)?.drone && <Row label="Drone" value="Allowed" />}
              {(d.practical as any)?.fuel_km != null && (
                <Row label="Nearest fuel" value={`${(d.practical as any).fuel_km} km`} />
              )}
              {(d.practical as any)?.toilet && <Row label="Toilet" value={(d.practical as any).toilet} />}
            </Section>
          )}
        </div>
      </div>

      <div className="pb-8">
        <div className="card overflow-hidden">
          <div className="p-6 pb-4">
            <h3 className="font-heading text-sm tracking-wider text-ink-3">MAP</h3>
          </div>
          <MapView
            lat={d.lat}
            lng={d.lng}
            height={450}
          />
        </div>
      </div>
    </>
  );
}


