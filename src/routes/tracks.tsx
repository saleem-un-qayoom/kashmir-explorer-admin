/**
 * Track recordings — V3 admin overview of all saved GPX hikes.
 *
 * Read-only. Useful for spotting community contributions, debugging
 * weird-shape recordings, and seeing aggregate volume.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Path, Mountains, Clock } from '@phosphor-icons/react';
import { PageHeader } from '@/components/Layout';
import { tracks } from '@/lib/api';

export const Route = createFileRoute('/tracks')({
  component: TracksPage,
});

function TracksPage() {
  const q = useQuery({ queryKey: ['tracks'], queryFn: tracks.list });
  const list = q.data ?? [];

  const totals = list.reduce(
    (s, t) => ({
      distance: s.distance + t.distance_m,
      duration: s.duration + t.duration_s,
      gain:     s.gain     + t.gain_m,
    }),
    { distance: 0, duration: 0, gain: 0 },
  );

  return (
    <>
      <PageHeader
        title="Track recordings · V3"
        subtitle={`${list.length} hikes recorded · ${(totals.distance / 1000).toFixed(0)} km · ${(totals.gain).toLocaleString()} m climbed`}
      />

      <div className="px-8 py-6">
        {q.isLoading && <div className="text-ink-2 text-sm">Loading…</div>}
        {!q.isLoading && list.length === 0 && (
          <div className="card p-8 text-center">
            <div className="font-serif italic text-2xl text-ink-2">
              "Aab-e-Hayat — the trails are quiet."
            </div>
            <div className="text-xs text-ink-3 mt-2 tracking-wider font-mono">
              NO TRACK RECORDINGS YET
            </div>
          </div>
        )}

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-pashmina/50 text-ink-3 text-xs tracking-wider font-mono">
              <tr>
                <th className="text-left px-4 py-3">HIKE</th>
                <th className="text-left px-4 py-3">USER</th>
                <th className="text-left px-4 py-3">TREK</th>
                <th className="text-right px-4 py-3">DISTANCE</th>
                <th className="text-right px-4 py-3">DURATION</th>
                <th className="text-right px-4 py-3">↑ GAIN</th>
                <th className="text-right px-4 py-3">MAX ALT</th>
                <th className="text-right px-4 py-3">PUBLIC</th>
                <th className="text-right px-4 py-3">WHEN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((t) => (
                <tr key={t.id} className="hover:bg-pashmina/30 transition">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3 text-ink-2">{t.user}</td>
                  <td className="px-4 py-3 text-ink-2 font-mono text-xs">
                    {t.trek_slug ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {(t.distance_m / 1000).toFixed(1)} km
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <Clock size={11} weight="duotone" className="inline mr-1 -mt-0.5" />
                    {fmtDuration(t.duration_s)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.gain_m.toLocaleString()} m
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {t.max_altitude_m ? (
                      <>
                        <Mountains size={11} weight="duotone" className="inline mr-1 -mt-0.5" />
                        {t.max_altitude_m.toLocaleString()} m
                      </>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.is_public ? <span className="pill pill-saffron">PUBLIC</span> : <span className="pill pill-neutral">PRIVATE</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-ink-3 font-mono text-xs">
                    {new Date(t.created_at).toLocaleDateString('en-IN')}
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

function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
