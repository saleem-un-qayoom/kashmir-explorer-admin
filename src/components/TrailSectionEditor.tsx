'use client';

import { type TrailSection } from '@/lib/api';

interface Props {
  sections: TrailSection[];
  onChange: (sections: TrailSection[]) => void;
}

const DIFFICULTIES = ['easy', 'moderate', 'hard', 'strenuous'] as const;
const TYPES = ['hike', 'camp', 'base_camp', 'summit', 'pass', 'lake', 'viewpoint'] as const;

function emptySection(): TrailSection {
  return {
    name: '',
    from: '',
    to: '',
    start_lat: 0,
    start_lng: 0,
    end_lat: 0,
    end_lng: 0,
    altitude_start_m: 0,
    altitude_end_m: 0,
    distance_km: 0,
    duration_hours: 0,
    difficulty: 'moderate',
    type: 'hike',
    description: '',
    photos: [],
  };
}

export function TrailSectionEditor({ sections, onChange }: Props) {
  const set = (idx: number, key: keyof TrailSection, val: any) => {
    const next = sections.map((s, i) => (i === idx ? { ...s, [key]: val } : s));
    onChange(next);
  };

  const add = () => onChange([...sections, emptySection()]);
  const remove = (idx: number) => onChange(sections.filter((_, i) => i !== idx));
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...sections];
    const t = idx + dir;
    if (t < 0 || t >= next.length) return;
    [next[idx], next[t]] = [next[t], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <p className="text-[11px] text-ink-3 font-quote italic">No trail sections defined yet. Add the camps / stops along the route.</p>
      )}

      {sections.map((s, i) => (
        <div key={i} className="border border-line rounded-btn p-4 space-y-3 bg-white/50 relative">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-mono text-ink-3 bg-pashmina/30 px-2 py-0.5 rounded">Section {i + 1}</span>
            <div className="flex gap-1">
              <button className="text-[11px] text-ink-3 hover:text-dal disabled:opacity-30 px-1" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button className="text-[11px] text-ink-3 hover:text-dal disabled:opacity-30 px-1" onClick={() => move(i, 1)} disabled={i === sections.length - 1}>↓</button>
              <button className="text-[11px] text-chinar hover:text-red-700 px-1" onClick={() => remove(i)}>✕</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Section name">
              <input className="input text-sm" value={s.name} onChange={(e) => set(i, 'name', e.target.value)} placeholder="Dara Harwan to Dara Top" />
            </Field>
            <Field label="Type">
              <select className="input text-sm" value={s.type} onChange={(e) => set(i, 'type', e.target.value)}>
                {TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From (place)">
              <input className="input text-sm" value={s.from} onChange={(e) => set(i, 'from', e.target.value)} placeholder="Dara Harwan" />
            </Field>
            <Field label="To (place)">
              <input className="input text-sm" value={s.to} onChange={(e) => set(i, 'to', e.target.value)} placeholder="Dara Top" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <fieldset className="border border-line rounded p-2">
              <legend className="text-[10px] text-ink-3 font-medium px-1">Start Coordinates</legend>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Lat">
                  <input className="input text-sm font-mono" type="number" step="any" value={s.start_lat || ''} onChange={(e) => set(i, 'start_lat', parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Lng">
                  <input className="input text-sm font-mono" type="number" step="any" value={s.start_lng || ''} onChange={(e) => set(i, 'start_lng', parseFloat(e.target.value) || 0)} />
                </Field>
              </div>
            </fieldset>
            <fieldset className="border border-line rounded p-2">
              <legend className="text-[10px] text-ink-3 font-medium px-1">End Coordinates</legend>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Lat">
                  <input className="input text-sm font-mono" type="number" step="any" value={s.end_lat || ''} onChange={(e) => set(i, 'end_lat', parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Lng">
                  <input className="input text-sm font-mono" type="number" step="any" value={s.end_lng || ''} onChange={(e) => set(i, 'end_lng', parseFloat(e.target.value) || 0)} />
                </Field>
              </div>
            </fieldset>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Field label="Altitude start (m)">
              <input className="input text-sm font-mono" type="number" value={s.altitude_start_m || ''} onChange={(e) => set(i, 'altitude_start_m', parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Altitude end (m)">
              <input className="input text-sm font-mono" type="number" value={s.altitude_end_m || ''} onChange={(e) => set(i, 'altitude_end_m', parseInt(e.target.value) || 0)} />
            </Field>
            <Field label="Distance (km)">
              <input className="input text-sm font-mono" type="number" step="0.01" value={s.distance_km || ''} onChange={(e) => set(i, 'distance_km', parseFloat(e.target.value) || 0)} />
            </Field>
            <Field label="Duration (hrs)">
              <input className="input text-sm font-mono" type="number" step="0.5" value={s.duration_hours || ''} onChange={(e) => set(i, 'duration_hours', parseFloat(e.target.value) || 0)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Difficulty">
              <select className="input text-sm" value={s.difficulty} onChange={(e) => set(i, 'difficulty', e.target.value as any)}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Photos (URLs, comma-separated)">
              <input className="input text-sm" value={(s.photos ?? []).join(', ')} onChange={(e) => set(i, 'photos', e.target.value.split(',').map((x) => x.trim()).filter(Boolean))} placeholder="https://..." />
            </Field>
          </div>

          <Field label="Description">
            <textarea className="input min-h-[60px] text-sm" value={s.description} onChange={(e) => set(i, 'description', e.target.value)} placeholder="Describe this leg of the trek — terrain, views, difficulty…" />
          </Field>
        </div>
      ))}

      <button className="text-xs font-medium text-dal hover:underline" onClick={add}>+ Add trail section</button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-ink-2 mb-0.5">{label}</label>
      {children}
    </div>
  );
}
