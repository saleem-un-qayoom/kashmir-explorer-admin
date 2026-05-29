/**
 * FeatureChips — AllTrails-style multi-select feature tags.
 *
 * Used on the trek detail editor for `features` and `activities` arrays.
 */
'use client';

interface Props {
  value: string[];
  options: { id: string; label: string; icon?: string }[];
  onChange: (next: string[]) => void;
}

export function FeatureChips({ value, options, onChange }: Props) {
  const set = new Set(value ?? []);
  const toggle = (id: string) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    onChange(Array.from(next));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = set.has(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              active
                ? 'bg-kong text-white border-kong'
                : 'bg-white text-ink-2 border-line hover:border-kong'
            }`}
          >
            {o.icon && <span className="mr-1">{o.icon}</span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* AllTrails-style feature catalogue, adapted for Kashmir context. */
export const TRAIL_FEATURES: Props['options'] = [
  { id: 'kid_friendly',  label: 'Kid-friendly',    icon: '👨‍👩‍👧' },
  { id: 'dog_friendly',  label: 'Dog-friendly',    icon: '🐕'    },
  { id: 'accessible',    label: 'Accessible',      icon: '♿'    },
  { id: 'waterfall',     label: 'Waterfall',       icon: '💦'    },
  { id: 'wildflowers',   label: 'Wildflowers',     icon: '🌷'    },
  { id: 'wildlife',      label: 'Wildlife',        icon: '🦌'    },
  { id: 'lake',          label: 'Lake',            icon: '💎'    },
  { id: 'glacier',       label: 'Glacier',         icon: '❄'     },
  { id: 'forest',        label: 'Forest',          icon: '🌲'    },
  { id: 'meadow',        label: 'Meadow',          icon: '🌾'    },
  { id: 'views',         label: 'Scenic views',    icon: '🏔'     },
  { id: 'camping',       label: 'Camping',         icon: '⛺'    },
  { id: 'historic',      label: 'Historic site',   icon: '🏛'     },
  { id: 'spiritual',     label: 'Spiritual / shrine', icon: '🕌' },
  { id: 'photography',   label: 'Photography',     icon: '📷'    },
  { id: 'no_shade',      label: 'No shade',        icon: '☀'     },
  { id: 'cliff_exposure', label: 'Cliff exposure', icon: '🪨'    },
  { id: 'river_crossing', label: 'River crossing', icon: '🌊'    },
];

export const TRAIL_ACTIVITIES: Props['options'] = [
  { id: 'hike',        label: 'Hiking',     icon: '🥾' },
  { id: 'trek',        label: 'Multi-day trek', icon: '🎒' },
  { id: 'mountaineer', label: 'Mountaineering', icon: '⛰' },
  { id: 'ski',         label: 'Ski touring', icon: '🎿' },
  { id: 'snowshoe',    label: 'Snowshoe',   icon: '❄' },
  { id: 'mtb',         label: 'Mountain bike', icon: '🚵' },
  { id: 'pilgrimage',  label: 'Pilgrimage', icon: '🙏' },
];

export const ROUTE_TYPES = [
  { id: 'out-and-back',  label: 'Out & back' },
  { id: 'loop',          label: 'Loop' },
  { id: 'point-to-point', label: 'Point-to-point' },
];
