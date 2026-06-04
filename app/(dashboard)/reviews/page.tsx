'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Trash, MapPin, Tent } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { reviews } from '@/lib/api';

type TargetFilter = 'all' | 'destination' | 'trek';

export default function ReviewsPage() {
  const [target, setTarget] = useState<TargetFilter>('all');
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ['admin-reviews'], queryFn: reviews.list });

  const remove = useMutation({
    mutationFn: (id: string) => reviews.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const all = q.data ?? [];
  const list = useMemo(
    () => (target === 'all' ? all : all.filter((r) => r.target_type === target)),
    [all, target],
  );

  return (
    <>
      <PageHeader title="Reviews · V3" subtitle={`User ratings & reviews · ${list.length} shown`} />

      <div className="px-8 pt-5 flex gap-2">
        {(['all', 'destination', 'trek'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTarget(t)}
            className={`pill ${target === t ? 'pill-saffron' : 'pill-neutral'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="px-8 py-6 grid gap-4">
        {q.isLoading && <div className="text-ink-2 text-sm">Loading…</div>}
        {!q.isLoading && list.length === 0 && (
          <div className="card p-8 text-center">
            <div className="font-serif italic text-2xl text-ink-2">&quot;No reviews here yet.&quot;</div>
            <div className="text-xs text-ink-3 mt-2 tracking-wider font-mono">NOTHING TO MODERATE</div>
          </div>
        )}

        {list.map((r) => {
          const TargetIcon = r.target_type === 'trek' ? Tent : MapPin;
          return (
            <div key={r.id} className={`card p-5 ${r.hidden ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-1">
                  <Stars value={r.rating} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="pill pill-neutral inline-flex items-center gap-1">
                      <TargetIcon size={12} weight="duotone" />
                      {r.target_slug || r.target_type}
                    </span>
                    {r.hidden && <span className="pill pill-danger">HIDDEN</span>}
                  </div>
                  {r.body && (
                    <div className="font-serif italic text-base text-ink mt-2 leading-relaxed">
                      &quot;{r.body}&quot;
                    </div>
                  )}
                  {r.photos && r.photos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {r.photos.map((p) => (
                        <img key={p} src={p} alt="" className="w-16 h-16 rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="font-mono text-[10px] text-ink-3 mt-3 tracking-wider flex items-center gap-3 flex-wrap">
                    <span>· {r.author || 'ANON'}</span>
                    <span>· {new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this review? This recomputes the target rating.')) remove.mutate(r.id);
                  }}
                  className="text-xs text-ink-3 font-medium tracking-wide hover:text-chinar transition flex items-center gap-1 shrink-0"
                  title="Delete review"
                  disabled={remove.isPending}
                >
                  <Trash size={14} weight="duotone" />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function Stars({ value }: { value: number }) {
  const color = value >= 4 ? 'text-emerald' : value >= 3 ? 'text-amber' : 'text-chinar';
  return (
    <span className={`inline-flex items-center gap-0.5 ${color}`} title={`${value}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} weight={i < value ? 'fill' : 'regular'} className={i < value ? '' : 'opacity-30'} />
      ))}
    </span>
  );
}
