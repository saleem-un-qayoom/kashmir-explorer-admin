'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { providers, type Provider } from '@/lib/api';

export default function ProvidersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['providers'], queryFn: providers.list });
  const verify = useMutation({
    mutationFn: (id: string) => providers.verify(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  });

  return (
    <>
      <PageHeader
        title="Providers"
        subtitle={`${data?.length ?? 0} listed · ${data?.filter((p) => p.verified).length ?? 0} JKTDC-verified`}
      />
      <div className="p-8 grid grid-cols-2 gap-4">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {data?.map((p) => (
          <ProviderCard key={p.id} p={p} onVerify={() => verify.mutate(p.id)} />
        ))}
      </div>
    </>
  );
}

function ProviderCard({ p, onVerify }: { p: Provider; onVerify: () => void }) {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl">
          {p.type === 'houseboat'
            ? '🛶'
            : p.type === 'shikara'
              ? '🚣'
              : p.type === 'guide'
                ? '🥾'
                : p.type === 'pony'
                  ? '🐎'
                  : p.type === 'cab'
                    ? '🚕'
                    : '🚁'}
        </span>
        <div className="flex-1">
          <div className="font-semibold">{p.name}</div>
          <div className="font-mono text-[10px] text-ink-3 mt-0.5 tracking-wide">{p.type.toUpperCase()}</div>
        </div>
        {p.verified ? (
          <span className="badge badge-sapphire">✓ VERIFIED</span>
        ) : (
          <button onClick={onVerify} className="btn btn-secondary text-xs">
            Verify
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-sm text-ink-2">
        <span>★ {p.rating.toFixed(1)}</span>
        <span className="font-mono">
          ₹{p.price_inr.toLocaleString('en-IN')} {p.price_unit.replace('-', ' ')}
        </span>
      </div>
    </div>
  );
}
