/**
 * GearListEditor — structured row-based editor for the trek gear list.
 * Replaces the raw-JSON textarea.
 *
 * Each row: name · category · essential checkbox.
 */
'use client';

import { Plus, Trash } from '@phosphor-icons/react';

export interface GearItem {
  name: string;
  category: 'clothing' | 'gear' | 'food' | 'safety' | 'documents' | 'other';
  essential: boolean;
}

const CATEGORIES: GearItem['category'][] = [
  'clothing', 'gear', 'food', 'safety', 'documents', 'other',
];

interface Props {
  value: GearItem[];
  onChange: (next: GearItem[]) => void;
}

export function GearListEditor({ value, onChange }: Props) {
  const rows = value ?? [];

  const add = () => onChange([...rows, { name: '', category: 'gear', essential: false }]);
  const update = (i: number, patch: Partial<GearItem>) =>
    onChange(rows.map((r, j) => (i === j ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_140px_70px_28px] gap-2 text-[10px] font-mono tracking-wider text-ink-3 px-1">
        <span>ITEM</span>
        <span>CATEGORY</span>
        <span className="text-center">ESSENTIAL</span>
        <span />
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-[1fr_140px_70px_28px] gap-2 items-center">
          <input
            type="text"
            value={r.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Down jacket"
            className="input text-sm"
          />
          <select
            value={r.category}
            onChange={(e) => update(i, { category: e.target.value as GearItem['category'] })}
            className="input text-xs"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex justify-center">
            <input
              type="checkbox"
              checked={r.essential}
              onChange={(e) => update(i, { essential: e.target.checked })}
              className="accent-chinar w-4 h-4"
            />
          </div>
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
        <Plus size={12} /> Add gear
      </button>
    </div>
  );
}
