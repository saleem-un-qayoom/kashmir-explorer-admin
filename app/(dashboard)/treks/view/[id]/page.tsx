'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { treks } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-800',
  moderate: 'bg-amber-100 text-amber-800',
  hard: 'bg-orange-100 text-orange-800',
  strenuous: 'bg-red-100 text-red-800',
};

export default function TrekView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['trek', id],
    queryFn: () => treks.adminGet(id),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Loading trek…</div>;
  }
  if (!data) {
    return <div className="p-12 text-center text-ink-2 font-quote italic">Trek not found.</div>;
  }

  const d = data;

  return (
    <>
      <PageHeader
        title={d.name}
        subtitle={d.slug}
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/treks')}>
              Back to list
            </button>
            <button className="btn btn-primary" onClick={() => router.push(`/treks/${id}`)}>
              Edit
            </button>
          </div>
        }
      />

      <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Overview">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Difficulty" value={d.difficulty} mono>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[d.difficulty]}`}>
                  {d.difficulty.toUpperCase()}
                </span>
              </Stat>
              <Stat label="Duration" value={`${d.duration_days} days`} />
              <Stat label="Distance" value={d.distance_km ? `${d.distance_km} km` : '—'} />
              <Stat label="Max altitude" value={d.max_altitude_m ? `${d.max_altitude_m.toLocaleString()} m` : '—'} />
              {d.elevation_gain_m != null && <Stat label="Elevation gain" value={`${d.elevation_gain_m} m`} />}
              {d.route_type && <Stat label="Route type" value={d.route_type.replace(/-/g, ' ')} />}
            </div>
            {d.tagline && <Row label="Tagline" value={d.tagline} />}
            {d.uniqueness && <Row label="Uniqueness" value={d.uniqueness} />}
          </Section>

          <Section title="Route">
            <div className="grid grid-cols-2 gap-4">
              <Row label="Start point" value={d.start_point} />
              <Row label="End point" value={d.end_point} />
            </div>
          </Section>

          <Section title="Season & Access">
            {d.best_months && d.best_months.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-ink-2 mb-2">Best months</label>
                <div className="flex flex-wrap gap-1.5">
                  {d.best_months.map((m) => (
                    <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-dal/10 text-dal border border-dal/20">
                      {MONTHS[m - 1]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {d.permits && d.permits.length > 0 && <Row label="Permits" value={d.permits.join(', ')} />}
            {d.ams_risk != null && <Row label="AMS risk" value={d.ams_risk ? 'Yes' : 'No'} />}
            {d.closure_reason && <Row label="Closure reason" value={d.closure_reason} />}
          </Section>

          {d.waypoints && d.waypoints.length > 0 && (
            <Section title="Waypoints">
              <div className="space-y-2">
                {d.waypoints.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm border-b border-line pb-2 last:border-0">
                    <span className="font-mono text-[10px] text-ink-3 w-6">D{w.day}</span>
                    <span className="font-medium">{w.name}</span>
                    <span className="text-[10px] text-ink-3 tracking-wider">{w.type.toUpperCase()}</span>
                    {w.altitudeM && <span className="font-mono text-xs text-ink-2 ml-auto">{w.altitudeM}m</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {d.trail_sections && d.trail_sections.length > 0 && (
            <Section title="Trail Sections">
              <div className="space-y-3">
                {d.trail_sections.map((s, i) => (
                  <div key={i} className="border border-line rounded-card p-4">
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-xs text-ink-2 mt-1">{s.from} → {s.to}</div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-ink-2">
                      <span>{s.distance_km} km</span>
                      <span>{s.duration_hours}h</span>
                      <span className={DIFFICULTY_COLORS[s.difficulty] ? `px-1.5 py-0.5 rounded ${DIFFICULTY_COLORS[s.difficulty]}` : ''}>
                        {s.difficulty}
                      </span>
                    </div>
                    {s.description && <p className="text-xs text-ink-2 mt-2">{s.description}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        <div className="space-y-6">
          <Section title="Status">
            <div className="flex gap-3 flex-wrap">
              <span className={`pill ${d.status === 'open' ? 'pill-success' : d.status === 'closing-soon' ? 'pill-warning' : 'pill-danger'}`}>
                {d.status.toUpperCase().replace('-', ' ')}
              </span>
              {d.is_published && <span className="badge badge-success">Published</span>}
            </div>
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
          </Section>

          <Section title="Guide">
            {d.guide_available != null && (
              <Row label="Guide available" value={d.guide_available ? 'Yes' : 'No'} />
            )}
            {d.guide_price_inr != null && d.guide_price_inr > 0 && (
              <Row label="Guide price" value={`₹${d.guide_price_inr}`} />
            )}
          </Section>

          <Section title="Features">
            {(d.features ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(d.features ?? []).map((f) => (
                  <span key={f} className="px-2.5 py-1 rounded-full text-xs font-medium bg-chinar/10 text-chinar border border-chinar/20">
                    {f.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-ink-3 italic">None</span>
            )}
          </Section>

          <Section title="Activities">
            {(d.activities ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(d.activities ?? []).map((a) => (
                  <span key={a} className="px-2.5 py-1 rounded-full text-xs font-medium bg-dal/10 text-dal border border-dal/20">
                    {a.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-ink-3 italic">None</span>
            )}
          </Section>

          {d.gear_list && d.gear_list.length > 0 && (
            <Section title="Gear List">
              <div className="space-y-1">
                {d.gear_list.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {g.essential && <span className="text-chinar text-xs">*</span>}
                    <span>{g.name}</span>
                    <span className="text-[10px] text-ink-3 ml-auto tracking-wider">{g.category}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h3 className="font-heading text-sm tracking-wider text-ink-3 mb-4">{title.toUpperCase()}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Stat({ label, value, mono, children }: { label: string; value?: string | null; mono?: boolean; children?: React.ReactNode }) {
  if (!value && !children) return null;
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-0.5">{label}</label>
      {children ?? <span className={`text-sm ${mono ? 'font-mono' : ''}`}>{value}</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <label className="block text-xs font-medium text-ink-2 mb-0.5">{label}</label>
      <span className="text-sm">{value}</span>
    </div>
  );
}
