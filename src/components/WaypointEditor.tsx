/**
 * WaypointEditor — structured row-based editor for trek waypoints.
 *
 * Replaces the raw-JSON textarea. Each row: day · name · type · alt · lat/lng.
 * Reorderable, deletable, supports clicking on the map to add a new one.
 */
'use client';

import { Plus, Trash, DotsSixVertical } from '@phosphor-icons/react';

export interface Waypoint {
  day: number;
  name: string;
  type: 'camp' | 'summit' | 'lake' | 'pass' | 'start' | 'end';
  altitudeM: number;
  distanceFromStartKm?: number;
  lat?: number;
  lng?: number;
  notes?: string;
}

const TYPES: Waypoint['type'][] = ['start', 'camp', 'lake', 'pass', 'summit', 'end'];

interface Props {
  value: Waypoint[];
  onChange: (next: Waypoint[]) => void;
}

export function WaypointEditor({ value, onChange }: Props) {
  const rows = value ?? [];

  const add = () => {
    const lastDay = rows.length ? rows[rows.length - 1].day : 1;
    onChange([
      ...rows,
      { day: lastDay, name: '', type: 'camp', altitudeM: 0 },
    ]);
  };
  const update = (i: number, patch: Partial<Waypoint>) => {
    onChange(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  };
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[18px_50px_1fr_110px_85px_90px_90px_28px] gap-2 text-[10px] font-mono tracking-wider text-ink-3 px-1">
        <span />
        <span>DAY</span>
        <span>NAME</span>
        <span>TYPE</span>
        <span>ALT (m)</span>
        <span>LAT</span>
        <span>LNG</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-[18px_50px_1fr_110px_85px_90px_90px_28px] gap-2 items-center"
        >
          <button
            type="button"
            onClick={() => move(i, -1)}
            className="text-ink-3 hover:text-ink transition"
            title="Move up"
          >
            <DotsSixVertical size={14} />
          </button>
          <input
            type="number"
            min={1}
            value={r.day}
            onChange={(e) => update(i, { day: parseInt(e.target.value) || 1 })}
            className="input font-mono text-xs"
          />
          <input
            type="text"
            value={r.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Vishansar Lake"
            className="input text-sm"
          />
          <select
            value={r.type}
            onChange={(e) => update(i, { type: e.target.value as Waypoint['type'] })}
            className="input text-xs"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="number"
            value={r.altitudeM || ''}
            onChange={(e) => update(i, { altitudeM: parseInt(e.target.value) || 0 })}
            placeholder="3710"
            className="input font-mono text-xs"
          />
          <input
            type="number"
            step="0.0001"
            value={r.lat ?? ''}
            onChange={(e) => update(i, { lat: parseFloat(e.target.value) || undefined })}
            placeholder="34.34"
            className="input font-mono text-xs"
          />
          <input
            type="number"
            step="0.0001"
            value={r.lng ?? ''}
            onChange={(e) => update(i, { lng: parseFloat(e.target.value) || undefined })}
            placeholder="75.13"
            className="input font-mono text-xs"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-chinar hover:text-chinar-deep transition"
            title="Remove"
          >
            <Trash size={14} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="btn btn-ghost text-xs flex items-center gap-1 mt-2"
      >
        <Plus size={12} /> Add waypoint
      </button>
    </div>
  );
}
