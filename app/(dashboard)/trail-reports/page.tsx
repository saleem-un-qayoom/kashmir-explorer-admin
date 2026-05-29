'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Warning, Snowflake, Path, Drop, CheckCircle, XCircle, Leaf } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { trailReports, type TrailReport } from '@/lib/api';

const CATEGORY_META: Record<string, { label: string; color: string; Icon: any }> = {
  snow: { label: 'Snow', color: 'border-l-dal', Icon: Snowflake },
  trail: { label: 'Trail', color: 'border-l-amber', Icon: Path },
  water: { label: 'Water', color: 'border-l-dal', Icon: Drop },
  wrong_path: { label: 'Wrong path', color: 'border-l-amber', Icon: Warning },
  blocked: { label: 'Blocked', color: 'border-l-chinar', Icon: Warning },
  unsafe: { label: 'Unsafe', color: 'border-l-chinar', Icon: Warning },
  wildlife: { label: 'Wildlife', color: 'border-l-amber', Icon: Warning },
  other: { label: 'Other', color: 'border-l-line', Icon: Warning },
};

export default function TrailReportsPage() {
  const [status, setStatus] = useState<TrailReport['status']>('open');
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['trail-reports', status],
    queryFn: () => trailReports.list(status),
  });

  const resolve = useMutation({
    mutationFn: ({ id, status: s }: { id: string; status: 'resolved' | 'dismissed' }) =>
      trailReports.resolve(id, s),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trail-reports'] }),
  });

  const reports = q.data ?? [];

  return (
    <>
      <PageHeader title="Trail reports · V3" subtitle={`Community trail-condition feed · ${reports.length} ${status}`} />

      <div className="px-8 pt-5 flex gap-2">
        {(['open', 'reviewing', 'resolved', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`pill ${status === s ? 'pill-saffron' : 'pill-neutral'}`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="px-8 py-6 grid gap-4">
        {q.isLoading && <div className="text-ink-2 text-sm">Loading…</div>}
        {!q.isLoading && reports.length === 0 && (
          <div className="card p-8 text-center">
            <div className="font-serif italic text-2xl text-ink-2">&quot;Aab-e-Saaf — every trail clear right now.&quot;</div>
            <div className="text-xs text-ink-3 mt-2 tracking-wider font-mono">NO {status.toUpperCase()} REPORTS</div>
          </div>
        )}

        {reports.map((r) => {
          const meta = CATEGORY_META[r.category] ?? CATEGORY_META.other;
          const Icon = meta.Icon;
          return (
            <div key={r.id} className={`card p-5 border-l-4 ${meta.color}`}>
              <div className="flex items-start gap-4">
                <Icon size={28} weight="duotone" className="text-ink-2 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="pill pill-neutral">{meta.label.toUpperCase()}</span>
                    <SeverityDial value={r.severity} />
                    <span className="font-mono text-[10px] text-ink-3 tracking-wider">
                      · {r.trek_name.toUpperCase()}
                    </span>
                  </div>
                  {r.body && (
                    <div className="font-serif italic text-base text-ink mt-2 leading-relaxed">
                      &quot;{r.body}&quot;
                    </div>
                  )}
                  <div className="font-mono text-[10px] text-ink-3 mt-3 tracking-wider flex items-center gap-3 flex-wrap">
                    <span>· {r.reporter || 'ANON'}</span>
                    <span>· {new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    {r.waypoint_idx != null && <span>· WP {r.waypoint_idx}</span>}
                    {r.lat && r.lng && (
                      <span>
                        · {r.lat.toFixed(4)}°N {r.lng.toFixed(4)}°E
                      </span>
                    )}
                  </div>
                </div>
                {r.photo_url && (
                  <img src={r.photo_url} alt="" className="w-20 h-20 rounded-md object-cover shrink-0" />
                )}
                {(status === 'open' || status === 'reviewing') && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => resolve.mutate({ id: r.id, status: 'resolved' })}
                      className="btn btn-secondary text-xs"
                      title="Mark resolved"
                    >
                      <CheckCircle size={14} weight="duotone" />
                      Resolve
                    </button>
                    <button
                      onClick={() => resolve.mutate({ id: r.id, status: 'dismissed' })}
                      className="text-xs text-ink-3 font-medium tracking-wide hover:text-chinar transition flex items-center gap-1"
                    >
                      <XCircle size={14} weight="duotone" />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SeverityDial({ value }: { value: number }) {
  const color = value >= 4 ? 'text-chinar' : value >= 3 ? 'text-amber' : 'text-ink-3';
  return (
    <span className={`inline-flex items-center gap-0.5 ${color}`} title={`Severity ${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Leaf key={i} size={11} weight={i < value ? 'fill' : 'regular'} className={i < value ? '' : 'opacity-30'} />
      ))}
    </span>
  );
}
