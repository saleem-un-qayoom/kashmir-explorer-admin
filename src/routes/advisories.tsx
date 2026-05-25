/**
 * Advisories — Live Ops console with WebSocket sync.
 *
 * Subscribes to /ws/advisories. Any advisory pushed by another admin or
 * by alert-worker appears here in real time.
 */
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/Layout';
import { advisories } from '@/lib/api';
import { liveOps } from '@/lib/ws';

export const Route = createFileRoute('/advisories')({
  component: AdvisoriesPage,
});

function AdvisoriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['advisories'], queryFn: advisories.list });
  const [open, setOpen] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);

  // WebSocket sync.
  useEffect(() => {
    liveOps.start();
    const unsub = liveOps.subscribe(() => {
      qc.invalidateQueries({ queryKey: ['advisories'] });
      setLiveConnected(true);
    });
    return () => { unsub(); liveOps.stop(); };
  }, [qc]);

  const create = useMutation({
    mutationFn: advisories.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['advisories'] }); setOpen(false); },
  });
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
            <span className={`inline-block w-2 h-2 rounded-full ${liveConnected ? 'bg-emerald' : 'bg-amber'} animate-pulse`} />
            {liveConnected ? 'Live · pushing to mobile clients' : 'Connecting to live feed…'}
          </span>
        }
        action={<button className="btn btn-primary" onClick={() => setOpen(true)}>+ Publish advisory</button>}
      />

      <div className="p-8 space-y-4">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {data?.map((a) => (
          <div
            key={a.id}
            className={`card p-5 border-l-4 ${
              a.severity === 'critical' ? 'border-l-chinar' :
              a.severity === 'warning'  ? 'border-l-amber' : 'border-l-dal'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`pill ${
                a.severity === 'critical' ? 'pill-danger' :
                a.severity === 'warning'  ? 'pill-warning' : 'pill-info'
              }`}>{a.severity.toUpperCase()} · {a.category.toUpperCase()}</span>
              <div className="flex-1">
                <div className="font-semibold text-lg">{a.title}</div>
                <div className="text-sm text-ink-2 mt-1">{a.body}</div>
                <div className="font-mono text-[10px] text-ink-3 mt-2 tracking-wider">
                  📍 {a.affected?.toUpperCase()} · UNTIL {new Date(a.valid_until).toLocaleDateString('en-IN')}
                </div>
              </div>
              <span className="pill pill-neutral">{a.source}</span>
              <button onClick={() => del.mutate(a.id)} className="text-chinar text-xs font-semibold">CLEAR</button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <PublishModal
          onClose={() => setOpen(false)}
          onSubmit={(p) => create.mutate(p)}
          submitting={create.isPending}
        />
      )}
    </>
  );
}

function PublishModal({ onClose, onSubmit, submitting }: any) {
  const [severity, setSeverity] = useState('warning');
  const [category, setCategory] = useState('road');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [affected, setAffected] = useState('');
  const [source, setSource] = useState('JKTDC');

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-8 z-50">
      <div className="card max-w-lg w-full p-6">
        <h2 className="font-serif text-xl font-bold mb-1">Publish advisory</h2>
        <p className="text-sm text-ink-2 mb-5">Live-pushed to every connected mobile client.</p>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Severity">
              <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </Field>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
                <option value="road">Road</option>
                <option value="weather">Weather</option>
                <option value="avalanche">Avalanche</option>
                <option value="security">Security</option>
                <option value="health">Health</option>
              </select>
            </Field>
          </div>
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm" placeholder="e.g. Razdan Pass closed" />
          </Field>
          <Field label="Body">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm min-h-[80px]" placeholder="Affected areas, expected duration…" />
          </Field>
          <Field label="Affected area">
            <input value={affected} onChange={(e) => setAffected(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm" placeholder="Bandipora → Gurez Valley" />
          </Field>
          <Field label="Source">
            <select value={source} onChange={(e) => setSource(e.target.value)} className="w-full rounded-btn border border-line bg-white px-3 py-2 text-sm">
              <option>JKTDC</option><option>IMD</option><option>NDMA</option><option>Admin</option>
            </select>
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            disabled={submitting || !title}
            onClick={() => onSubmit({ severity, category, title, body, affected, source, valid_hours: 48 })}
          >
            {submitting ? 'Publishing…' : 'Publish & push'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] tracking-wider text-ink-3 block mb-1">{label.toUpperCase()}</span>
      {children}
    </label>
  );
}
