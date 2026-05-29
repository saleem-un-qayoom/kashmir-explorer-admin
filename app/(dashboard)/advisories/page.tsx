'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { advisories } from '@/lib/api';
import { liveOps } from '@/lib/ws';

export default function AdvisoriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['advisories'], queryFn: advisories.list });
  const router = useRouter();
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    liveOps.start();
    const unsub = liveOps.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['advisories'] });
      setLiveConnected(true);
    });
    return () => {
      unsub();
      liveOps.stop();
    };
  }, [qc]);

  const del = useMutation({
    mutationFn: (id: string) => advisories.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advisories'] }),
  });

  return (
    <>
      <PageHeader
        title="Advisories · Live Ops"
        subtitle={
          <span className="flex items-center gap-2">
            <span
              className={`inline-block w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald' : 'bg-amber'} animate-pulse`}
            />
            {liveConnected ? 'Live · pushing to mobile clients' : 'Connecting to live feed…'}
          </span>
        }
        action={
          <button className="btn btn-primary" onClick={() => router.push('/advisories/new')}>
            + Publish advisory
          </button>
        }
      />

      <div className="p-8 space-y-4">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {data?.map((a) => (
          <div
            key={a.id}
            className={`card p-5 border-l-4 ${
              a.severity === 'critical'
                ? 'border-l-chinar'
                : a.severity === 'warning'
                  ? 'border-l-amber'
                  : 'border-l-dal'
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`pill ${
                  a.severity === 'critical'
                    ? 'pill-danger'
                    : a.severity === 'warning'
                      ? 'pill-warning'
                      : 'pill-info'
                }`}
              >
                {a.severity.toUpperCase()} · {a.category.toUpperCase()}
              </span>
              <div className="flex-1">
                <div className="font-semibold text-lg">{a.title}</div>
                <div className="text-sm text-ink-2 mt-1">{a.body}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-2 tracking-wider flex items-center gap-1">
                  <MapPin size={12} weight="duotone" />
                  {a.affected?.toUpperCase()} · UNTIL {new Date(a.valid_until).toLocaleDateString('en-IN')}
                </div>
              </div>
              <span className="pill pill-neutral">{a.source}</span>
              <button onClick={() => del.mutate(a.id)} className="text-chinar text-xs font-semibold">
                CLEAR
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
