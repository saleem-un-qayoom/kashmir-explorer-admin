'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { destinations, treks, advisories, providers } from '@/lib/api';
import Link from 'next/link';
import {
  MapPin,
  Tent,
  Bed,
  Warning,
  Plus,
  Megaphone,
  SealCheck,
  ArrowRight,
  Mountains,
  type Icon as PhIcon,
} from '@phosphor-icons/react';

type Tone = 'kong' | 'emerald' | 'sapphire' | 'chinar' | 'ink-2';

const TONE_STYLES: Record<Tone, { text: string; bg: string; ring: string }> = {
  kong: { text: 'text-kong', bg: 'bg-kong/10', ring: 'from-kong/20' },
  emerald: { text: 'text-emerald', bg: 'bg-emerald/10', ring: 'from-emerald/20' },
  sapphire: { text: 'text-sapphire', bg: 'bg-sapphire/10', ring: 'from-sapphire/20' },
  chinar: { text: 'text-chinar', bg: 'bg-chinar/10', ring: 'from-chinar/20' },
  'ink-2': { text: 'text-ink-2', bg: 'bg-ink-3/10', ring: 'from-ink-3/20' },
};

export default function OverviewPage() {
  const dQuery = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });
  const tQuery = useQuery({ queryKey: ['treks'], queryFn: treks.list });
  const aQuery = useQuery({ queryKey: ['advisories'], queryFn: advisories.list });
  const pQuery = useQuery({ queryKey: ['providers'], queryFn: providers.list });

  const critical = aQuery.data?.filter((a) => a.severity === 'critical') ?? [];

  return (
    <>
      <PageHeader title="Overview" subtitle="Operations · live data from the API" />

      <div className="p-8 space-y-6">
        {/* KPI row */}
        <div className="stagger grid grid-cols-12 gap-5">
          <Kpi
            label="Destinations"
            value={dQuery.data?.length}
            sub="published"
            tone="kong"
            Icon={MapPin}
            loading={dQuery.isLoading}
          />
          <Kpi
            label="Treks"
            value={tQuery.data?.length}
            sub={`${tQuery.data?.filter((t) => t.status === 'open').length ?? 0} open`}
            tone="emerald"
            Icon={Tent}
            loading={tQuery.isLoading}
          />
          <Kpi
            label="Providers"
            value={pQuery.data?.length}
            sub={`${pQuery.data?.filter((p) => p.verified).length ?? 0} verified`}
            tone="sapphire"
            Icon={Bed}
            loading={pQuery.isLoading}
          />
          <Kpi
            label="Active advisories"
            value={aQuery.data?.length}
            sub={`${critical.length} critical`}
            tone={critical.length > 0 ? 'chinar' : 'ink-2'}
            Icon={Warning}
            loading={aQuery.isLoading}
            alert={critical.length > 0}
          />
        </div>

        {/* Critical advisories + quick actions */}
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-12 lg:col-span-8 card p-6 animate-rise" style={{ animationDelay: '0.12s' }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Warning size={18} weight="fill" className="text-chinar" />
                <h2 className="font-serif text-lg font-bold">Critical advisories</h2>
              </div>
              <Link
                href="/advisories"
                className="group inline-flex items-center gap-1 text-xs text-dal font-medium tracking-wide hover:text-kong transition-colors"
              >
                ALL
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            {aQuery.isLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
              </div>
            ) : critical.length === 0 ? (
              <div className="flex items-center gap-3 rounded-card border border-emerald/20 bg-emerald/5 p-4">
                <SealCheck size={22} weight="fill" className="text-emerald shrink-0" />
                <p className="font-quote italic text-ink-2 text-base">All clear — no critical alerts right now.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {critical.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 border-l-2 border-chinar bg-chinar/5 p-3 rounded transition-colors hover:bg-chinar/10"
                  >
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

          <div className="col-span-12 lg:col-span-4 card p-6 animate-rise" style={{ animationDelay: '0.16s' }}>
            <h2 className="font-serif text-lg font-bold mb-4">Quick actions</h2>
            <div className="flex flex-col gap-2.5">
              <Link href="/destinations/new" className="btn btn-primary">
                <Plus size={16} weight="bold" /> New destination
              </Link>
              <Link href="/advisories/new" className="btn btn-secondary">
                <Megaphone size={16} /> Publish advisory
              </Link>
              <Link href="/providers" className="btn btn-secondary">
                <SealCheck size={16} /> Verify provider
              </Link>
            </div>
          </div>
        </div>

        {/* Recently added */}
        <div className="card p-6 animate-rise" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-bold">Recently added</h2>
            <Link
              href="/destinations"
              className="group inline-flex items-center gap-1 text-xs text-dal font-medium tracking-wide hover:text-kong transition-colors"
            >
              VIEW ALL
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {dQuery.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-24" />
              ))}
            </div>
          ) : (
            <div className="stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(dQuery.data ?? []).slice(0, 6).map((d) => (
                <Link
                  key={d.id}
                  href={`/destinations/${d.id}`}
                  className="card card-hover block p-4"
                >
                  <div className="font-semibold">{d.name}</div>
                  <div className="font-mono text-[10px] text-ink-3 mt-1 tracking-wider flex items-center gap-1">
                    {d.district?.toUpperCase()} · <Mountains size={11} weight="fill" /> {d.altitude_m}M
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {(d.categories ?? []).map((c) => (
                      <span key={c} className="pill pill-neutral">{c}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
  Icon,
  loading,
  alert,
}: {
  label: string;
  value: number | undefined;
  sub: string;
  tone: Tone;
  Icon: PhIcon;
  loading?: boolean;
  alert?: boolean;
}) {
  const s = TONE_STYLES[tone];
  return (
    <div className="col-span-6 lg:col-span-3 card card-hover relative overflow-hidden p-5">
      {/* decorative corner glow */}
      <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${s.ring} to-transparent blur-xl`} />
      <div className="flex items-start justify-between">
        <div className="font-mono text-[10px] tracking-wider text-ink-3">{label.toUpperCase()}</div>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.bg} ${alert ? 'pulse-dot' : ''}`}>
          <Icon size={16} weight="fill" className={s.text} />
        </div>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-10 w-16" />
      ) : (
        <div className={`font-serif text-4xl font-bold mt-2 ${s.text}`}>{value ?? '—'}</div>
      )}
      <div className="text-xs text-ink-2 mt-1">{sub}</div>
    </div>
  );
}
