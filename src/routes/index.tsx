/**
 * Overview — operational dashboard. Live counts, recent activity, top KPIs.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/Layout';
import { destinations, treks, advisories, providers } from '@/lib/api';

export const Route = createFileRoute('/')({
  component: Overview,
});

function Overview() {
  const dQuery = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });
  const tQuery = useQuery({ queryKey: ['treks'], queryFn: treks.list });
  const aQuery = useQuery({ queryKey: ['advisories'], queryFn: advisories.list });
  const pQuery = useQuery({ queryKey: ['providers'], queryFn: providers.list });

  const critical = aQuery.data?.filter((a) => a.severity === 'critical') ?? [];

  return (
    <>
      <PageHeader title="Overview" subtitle="Operations · live data from the API" />

      <div className="p-8 grid grid-cols-12 gap-6">
        {/* KPI row */}
        <Kpi label="Destinations" value={dQuery.data?.length ?? '—'} sub="published" tone="kong" />
        <Kpi label="Treks" value={tQuery.data?.length ?? '—'} sub={`${tQuery.data?.filter((t) => t.status === 'open').length ?? 0} open`} tone="emerald" />
        <Kpi label="Providers" value={pQuery.data?.length ?? '—'} sub={`${pQuery.data?.filter((p) => p.verified).length ?? 0} verified`} tone="sapphire" />
        <Kpi label="Active advisories" value={aQuery.data?.length ?? '—'} sub={`${critical.length} critical`} tone={critical.length > 0 ? 'chinar' : 'ink-2'} />

        {/* Critical advisories — operations need this front and centre */}
        <div className="col-span-8 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold">Critical advisories</h2>
            <a href="/advisories" className="text-xs text-dal font-medium tracking-wide">
              ALL →
            </a>
          </div>
          {critical.length === 0 ? (
            <p className="font-quote italic text-ink-2 text-base">All clear. Last critical alert cleared 4 hr ago.</p>
          ) : (
            <ul className="space-y-3">
              {critical.map((a) => (
                <li key={a.id} className="flex items-start gap-3 border-l-2 border-chinar bg-chinar/5 p-3 rounded">
                  <span className="font-mono text-[10px] tracking-wider text-chinar mt-1">{a.category.toUpperCase()}</span>
                  <div className="flex-1">
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-sm text-ink-2 mt-1">{a.body}</div>
                  </div>
                  <span className="pill pill-neutral">{a.source}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Quick links */}
        <div className="col-span-4 card p-6">
          <h2 className="font-serif text-lg font-bold mb-4">Quick actions</h2>
          <div className="flex flex-col gap-2">
            <a href="/destinations" className="btn btn-primary">+ New destination</a>
            <a href="/advisories" className="btn btn-secondary">Publish advisory</a>
            <a href="/providers" className="btn btn-secondary">Verify provider</a>
          </div>
        </div>

        {/* Recent destinations */}
        <div className="col-span-12 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold">Recently added</h2>
            <a href="/destinations" className="text-xs text-dal font-medium tracking-wide">VIEW ALL →</a>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(dQuery.data ?? []).slice(0, 6).map((d) => (
              <div key={d.id} className="border border-line rounded-card p-4">
                <div className="font-semibold">{d.name}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-1 tracking-wider">
                  {d.district?.toUpperCase()} · ⛰ {d.altitude_m}M
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {(d.categories ?? []).map((c) => (
                    <span key={c} className="pill pill-neutral">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: any; sub: string; tone: string }) {
  return (
    <div className="col-span-3 card p-5">
      <div className="font-mono text-[10px] tracking-wider text-ink-3">{label.toUpperCase()}</div>
      <div className={`font-serif text-4xl font-bold mt-2 text-${tone}`}>{value}</div>
      <div className="text-xs text-ink-2 mt-1">{sub}</div>
    </div>
  );
}
