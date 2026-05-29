/**
 * ToggleGrid — reusable multi-select grid used for Categories, Activities,
 * and Trail Features in the destination / trek editors.
 *
 * Each item shows a color dot, label, and a checkmark when active.
 * Active state uses inline styles so no Tailwind JIT purge issues with
 * dynamic color classes.
 */
'use client';

interface ToggleItem {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

interface Props {
  value: string[];
  options: ToggleItem[];
  onChange: (next: string[]) => void;
  cols?: 2 | 3 | 4;
}

const FALLBACK_COLORS = [
  '#2A5266', '#E8893A', '#2D6A4F', '#B23A2E', '#C9A227',
  '#1F4788', '#D97444', '#8B4513', '#C72D3D', '#4A8FB5',
];

export function ToggleGrid({ value, options, onChange, cols = 3 }: Props) {
  const set = new Set((value ?? []).filter(Boolean));

  const toggle = (id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(Array.from(next));
  };

  const gridClass =
    cols === 2 ? 'grid grid-cols-2 gap-2'
    : cols === 4 ? 'grid grid-cols-2 sm:grid-cols-4 gap-2'
    : 'grid grid-cols-2 sm:grid-cols-3 gap-2';

  return (
    <div className={gridClass}>
      {options.filter((o) => !!o.id?.trim() && !!o.label?.trim()).map((opt, i) => {
        const active = set.has(opt.id);
        const accent = opt.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            style={active ? {
              backgroundColor: accent + '18',
              borderColor: accent,
            } : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition text-left w-full ${
              active
                ? ''
                : 'border-line bg-white text-ink-2 hover:border-dal/40 hover:bg-pashmina/40'
            }`}
          >
            {/* Dot */}
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 border"
              style={{
                backgroundColor: active ? accent : 'transparent',
                borderColor: active ? accent : '#C9B89C',
              }}
            />
            {/* Label */}
            <span className="flex-1 truncate" style={{ color: '#1A1612' }}>
              {opt.label}
            </span>
            {/* Checkmark */}
            {active && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path
                  d="M5 12.5L10 17l9-10"
                  stroke={accent}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
