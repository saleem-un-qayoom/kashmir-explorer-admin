import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/Layout';
import { treks } from '@/lib/api';

export const Route = createFileRoute('/treks')({
  component: TreksPage,
});

function TreksPage() {
  const { data, isLoading } = useQuery({ queryKey: ['treks'], queryFn: treks.list });

  return (
    <>
      <PageHeader
        title="Treks"
        subtitle={`${data?.length ?? 0} routes · ${data?.filter((t) => t.status === 'open').length ?? 0} currently open`}
        action={<button className="btn btn-primary">+ New trek</button>}
      />
      <div className="p-8">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/30 border-b border-line">
              <tr>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Name</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Difficulty</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Days</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Max alt</th>
                <th className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (<tr><td colSpan={6} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>)}
              {data?.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{t.name}</div>
                    <div className="font-mono text-[10px] text-ink-3 mt-0.5">{t.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge badge-${t.difficulty === 'easy' ? 'success' : t.difficulty === 'moderate' ? 'warning' : 'danger'}`}>
                      {t.difficulty.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono">{t.duration_days}D</td>
                  <td className="px-4 py-3 font-mono">{t.max_altitude_m}m</td>
                  <td className="px-4 py-3">
                    <span className={`pill ${t.status === 'open' ? 'pill-success' : t.status === 'closing-soon' ? 'pill-warning' : 'pill-danger'}`}>
                      {t.status.toUpperCase().replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="btn btn-ghost text-xs">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
