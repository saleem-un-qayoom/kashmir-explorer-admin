'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { destinations, treks, advisories, providers } from '@/lib/api';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  Compass,
} from '@phosphor-icons/react';

type Tone = 'kong' | 'emerald' | 'sapphire' | 'chinar' | 'ink-2';

const TONE_STYLES: Record<Tone, { text: string; bg: string; ring: string; border: string; glow: string }> = {
  kong:     { text: 'text-kong',     bg: 'bg-kong/10',    ring: 'bg-kong/15',    border: 'border-kong/20', glow: 'kpi-glow-kong' },
  emerald: { text: 'text-emerald',  bg: 'bg-emerald/10', ring: 'bg-emerald/15', border: 'border-emerald/20', glow: 'kpi-glow-emerald' },
  sapphire: { text: 'text-sapphire', bg: 'bg-sapphire/10',ring: 'bg-sapphire/15',border: 'border-sapphire/20', glow: 'kpi-glow-sapphire' },
  chinar:   { text: 'text-chinar',   bg: 'bg-chinar/10',  ring: 'bg-chinar/15',  border: 'border-chinar/20', glow: 'kpi-glow-chinar' },
  'ink-2':  { text: 'text-ink-2',    bg: 'bg-ink-3/10',   ring: 'bg-ink-3/15',   border: 'border-ink-3/20', glow: '' },
};

/* ─── Animated counter ─────────────────────────────────── */
function AnimatedNumber({ value, suffix = '' }: { value: number | undefined; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (value == null) return;
    const start = display;
    const end = value;
    const duration = 800;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };

    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [value]);

  return <>{display}{suffix}</>;
}

/* ─── Mini sparkline ───────────────────────────────────── */
function Sparkline({ data, color = '#E8893A', height = 28 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(0)},${y.toFixed(0)}`;
  }).join(' ');
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="shrink-0">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" opacity={0.6} />
      <polygon points={`${pts} ${w},${height} 0,${height}`} fill={`${color}12`} />
    </svg>
  );
}

export default function OverviewPage() {
  const dQuery = useQuery({ queryKey: ['destinations'], queryFn: destinations.list });
  const tQuery = useQuery({ queryKey: ['treks'],        queryFn: treks.list });
  const aQuery = useQuery({ queryKey: ['advisories'],   queryFn: advisories.list });
  const pQuery = useQuery({ queryKey: ['providers'],    queryFn: providers.list });

  const critical = aQuery.data?.filter((a) => a.severity === 'critical') ?? [];

  // Synthetic sparkline data for visual flair
  const destSpark = [12, 15, 13, 18, 16, 22, 21, 24, 23, 27, 25, dQuery.data?.length ?? 0];
  const trekSpark = [6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, tQuery.data?.length ?? 0];

  const kpis = [
    {
      label: 'Destinations',
      value: dQuery.data?.length,
      sub: 'published',
      tone: 'kong' as Tone,
      Icon: MapPin,
      loading: dQuery.isLoading,
      spark: destSpark,
    },
    {
      label: 'Treks',
      value: tQuery.data?.length,
      sub: `${tQuery.data?.filter((t) => t.status === 'open').length ?? 0} open`,
      tone: 'emerald' as Tone,
      Icon: Tent,
      loading: tQuery.isLoading,
      spark: trekSpark,
    },
    {
      label: 'Providers',
      value: pQuery.data?.length,
      sub: `${pQuery.data?.filter((p) => p.verified).length ?? 0} verified`,
      tone: 'sapphire' as Tone,
      Icon: Bed,
      loading: pQuery.isLoading,
    },
    {
      label: 'Active advisories',
      value: aQuery.data?.length,
      sub: `${critical.length} critical`,
      tone: (critical.length > 0 ? 'chinar' : 'ink-2') as Tone,
      Icon: Warning,
      loading: aQuery.isLoading,
      alert: critical.length > 0,
    },
  ];

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle={
          <span className="inline-flex items-center gap-2">
            Operations · live data from the API
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
          </span>
        }
      />

      <div className="p-6 lg:p-8 space-y-8">

        {/* ── KPI row with Aurora backdrop ─────────────────── */}
        <div className="relative rounded-xl p-px">
          <div className="absolute inset-0 rounded-xl aurora-bg opacity-40" />
          <div className="relative rounded-xl bg-white/80 dark:bg-dark-surface/80 backdrop-blur-sm">
            <div className="stagger grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-4 p-4 lg:p-5">
              {kpis.map((kpi, i) => {
                const s = TONE_STYLES[kpi.tone];
                const featured = i === 0; // Donezo: first KPI is the green-gradient hero card
                const sparkColor = featured ? '#FFFFFF' : kpi.tone === 'sapphire' ? '#3B6FE0' : kpi.tone === 'chinar' ? '#E2483D' : '#1F9D57';
                return (
                  <div
                    key={kpi.label}
                    className={`kpi-glow ${featured ? '' : s.glow} relative overflow-hidden p-5 rounded-xl border transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-0.5 ${featured ? 'border-transparent bg-gradient-to-br from-kong to-kong-deep text-white shadow-warm-lg' : `${s.border} bg-white dark:bg-dark-surface`}`}
                    style={{ animationDelay: `${0.04 * i}s` }}
                  >
                    {/* Decorative corner glow */}
                    <div className={`pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br ${featured ? 'from-white/25' : s.ring} to-transparent blur-xl`} />
                    <div className="flex items-start justify-between">
                      <div className={`font-mono text-[10px] tracking-widest uppercase ${featured ? 'text-white/70' : 'text-ink-3 dark:text-dark-text-3'}`}>{kpi.label}</div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${featured ? 'bg-white/15' : s.bg} ${kpi.alert ? 'animate-pulse' : ''}`}>
                        <kpi.Icon size={16} weight="fill" className={featured ? 'text-white' : s.text} />
                      </div>
                    </div>
                    <div className="flex items-end gap-3">
                      {kpi.loading ? (
                        <div className="skeleton mt-3 h-10 w-16 rounded" />
                      ) : (
                        <div className={`font-serif text-4xl font-bold mt-2 ${featured ? 'text-white' : s.text} animate-count-up`}>
                          <AnimatedNumber value={kpi.value} />
                        </div>
                      )}
                      {kpi.spark && !kpi.loading && (
                        <div className="mb-1">
                          <Sparkline data={kpi.spark} color={sparkColor} />
                        </div>
                      )}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${featured ? 'text-white/70' : 'text-ink-2 dark:text-dark-text-2'}`}>{kpi.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Advisories + Quick actions ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Critical advisories — 2/3 width on lg */}
          <div
            className="lg:col-span-2 card p-6 animate-rise relative overflow-hidden rounded-xl border-l-4 border-l-chinar/60"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.03] pointer-events-none">
              <svg viewBox="0 0 100 100" fill="#B23A2E">
                <polygon points="50,5 95,50 50,95 5,50" />
              </svg>
            </div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-chinar/10">
                  <Warning size={16} weight="fill" className="text-chinar" />
                </div>
                <h2 className="font-serif text-lg font-bold text-ink dark:text-dark-text">Critical advisories</h2>
              </div>
              <Link
                href="/advisories"
                className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-dal dark:text-dal/80 hover:text-kong transition-colors duration-200"
              >
                View all
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {aQuery.isLoading ? (
              <div className="space-y-3">
                <div className="skeleton h-16" />
                <div className="skeleton h-16" />
              </div>
            ) : critical.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald/20 bg-emerald/5 dark:bg-emerald/8 p-4">
                <SealCheck size={22} weight="fill" className="text-emerald shrink-0" />
                <p className="font-quote italic text-ink-2 dark:text-dark-text-2 text-base leading-snug">
                  All clear — no critical alerts right now.
                </p>
              </div>
            ) : (
              <ul className="space-y-3">
                {critical.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-3 border-l-2 border-chinar bg-chinar/5 dark:bg-chinar/8 p-4 rounded-xl transition-all duration-200 hover:bg-chinar/8 hover:pl-5"
                  >
                    <span className="font-mono text-[10px] tracking-widest text-chinar mt-0.5 uppercase shrink-0">
                      {a.category}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-ink dark:text-dark-text leading-snug">{a.title}</div>
                      <div className="text-sm text-ink-2 dark:text-dark-text-2 mt-1 leading-relaxed line-clamp-2">{a.body}</div>
                    </div>
                    <span className="pill pill-neutral shrink-0">{a.source}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick actions — 1/3 width on lg */}
          <div className="card p-6 animate-rise flex flex-col rounded-xl" style={{ animationDelay: '0.15s' }}>
            <h2 className="font-serif text-lg font-bold text-ink dark:text-dark-text mb-5">Quick actions</h2>
            <div className="flex flex-col gap-3 flex-1">
              <Link href="/destinations/new" className="btn btn-primary justify-center gap-2 py-3">
                <Plus size={16} weight="bold" /> New destination
              </Link>
              <Link href="/advisories/new" className="btn btn-secondary justify-center gap-2 py-3">
                <Megaphone size={16} /> Publish advisory
              </Link>
              <Link href="/providers" className="btn btn-glass justify-center gap-2 py-3">
                <SealCheck size={16} /> Verify provider
              </Link>
            </div>

            {/* Kashmir cultural bottom decoration */}
            <div className="mt-auto pt-6">
              <div className="sep" />
              <p className="text-center text-[10px] text-ink-3 dark:text-dark-text-3 mt-2 font-quote italic tracking-wide">
                Paradise, with the receipts.
              </p>
            </div>
          </div>
        </div>

        {/* ── Recently added ─────────────────────────────────── */}
        <div className="card p-6 animate-rise rounded-xl" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-kong/10">
                <Compass size={16} weight="fill" className="text-kong" />
              </div>
              <h2 className="font-serif text-lg font-bold text-ink dark:text-dark-text">Recently added</h2>
            </div>
            <Link
              href="/destinations"
              className="group inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-dal dark:text-dal/80 hover:text-kong transition-colors duration-200"
            >
              View all
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
              {(dQuery.data ?? []).slice(0, 6).map((d, i) => (
                <Link
                  key={d.id}
                  href={`/destinations/${d.id}`}
                  className="card card-hover block p-4 rounded-xl border border-line/50 dark:border-dark-line/50 hover:border-kong/30 dark:hover:border-kong/30 transition-all duration-200 group"
                  style={{ animationDelay: `${0.25 + i * 0.05}s` }}
                >
                  <div className="font-serif font-bold text-ink dark:text-dark-text group-hover:text-kong transition-colors duration-200 leading-tight">
                    {d.name}
                  </div>
                  <div className="font-mono text-[10px] text-ink-3 dark:text-dark-text-3 mt-1.5 tracking-wider flex items-center gap-1.5">
                    {d.district?.toUpperCase()}&ensp;&middot;&ensp;
                    <Mountains size={11} weight="fill" className="text-dal" />
                    &thinsp;{d.altitude_m}M
                  </div>
                  <div className="mt-3 flex gap-1.5 flex-wrap">
                    {(d.categories ?? []).slice(0, 3).map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-dal/8 dark:bg-dal/15 text-dal dark:text-dal/80 text-[10px] font-medium"
                      >
                        {c}
                      </span>
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
