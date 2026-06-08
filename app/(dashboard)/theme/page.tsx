'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ArrowCounterClockwise, FloppyDisk } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { appTheme } from '@/lib/api';

const QK = ['app-theme'];

// Shipped defaults — mirror of @kashmir/design-tokens `K`. The admin overrides
// these; an empty override map means the app uses these built-in values.
const DEFAULTS: Record<string, string> = {
  saffron: '#E8893A',
  saffronDeep: '#A65420',
  dalBlue: '#2A5266',
  dalDeep: '#15303E',
  chinarRed: '#B23A2E',
  chinarAmber: '#D97444',
  pashmina: '#F5EBDC',
  pashminaDk: '#3D352A',
  sapphire: '#1F4788',
  almond: '#F4C6C0',
  tulip: '#C72D3D',
  emerald: '#2D6A4F',
  mustard: '#C9A227',
  snowMist: '#EDF2F5',
  terra: '#8B4513',
  bg: '#F5EBDC',
  surface: '#FFFFFF',
  raised: '#FAF3E7',
  text: '#1A1612',
  text2: '#5A4F42',
  text3: '#8B7E6F',
  line: '#E5D9C5',
  lineStrong: '#C9B89C',
};

type Group = { heading: string; note: string; keys: { key: string; label: string }[] };

const GROUPS: Group[] = [
  {
    heading: 'Brand',
    note: 'The primary identity colours — CTAs, headers, navigation.',
    keys: [
      { key: 'saffron', label: 'Saffron (primary CTA)' },
      { key: 'saffronDeep', label: 'Saffron deep (pressed)' },
      { key: 'dalBlue', label: 'Dal blue (brand / headers)' },
      { key: 'dalDeep', label: 'Dal deep (dark bg)' },
    ],
  },
  {
    heading: 'Accents',
    note: 'Semantic + festival accents used across badges, banners and states.',
    keys: [
      { key: 'chinarRed', label: 'Chinar red (errors)' },
      { key: 'chinarAmber', label: 'Chinar amber (warnings)' },
      { key: 'emerald', label: 'Emerald (success / cultural)' },
      { key: 'sapphire', label: 'Sapphire (premium)' },
      { key: 'mustard', label: 'Mustard (gold thread)' },
      { key: 'almond', label: 'Almond (spring)' },
      { key: 'tulip', label: 'Tulip (festival)' },
      { key: 'snowMist', label: 'Snow mist (winter)' },
      { key: 'terra', label: 'Terra (walnut wood)' },
    ],
  },
  {
    heading: 'Surfaces',
    note: 'Backgrounds and card fills.',
    keys: [
      { key: 'bg', label: 'App background' },
      { key: 'surface', label: 'Surface (cards)' },
      { key: 'raised', label: 'Raised (elevated)' },
      { key: 'pashmina', label: 'Pashmina (cream base)' },
      { key: 'pashminaDk', label: 'Pashmina dark' },
    ],
  },
  {
    heading: 'Text & lines',
    note: 'Type colours and hairline borders.',
    keys: [
      { key: 'text', label: 'Text primary' },
      { key: 'text2', label: 'Text secondary' },
      { key: 'text3', label: 'Text tertiary' },
      { key: 'line', label: 'Line (subtle)' },
      { key: 'lineStrong', label: 'Line (strong)' },
    ],
  },
];

// ── Predefined themes ─────────────────────────────────────────────
// Each preset is a full set of overrides. "Kashmir" is the shipped default
// (empty overrides). `swatch` colors drive the little preview dots on the chip.
type Preset = {
  id: string;
  name: string;
  note: string;
  swatch: [string, string, string];
  colors: Record<string, string>;
};

const PRESETS: Preset[] = [
  {
    id: 'kashmir',
    name: 'Kashmir (default)',
    note: 'Saffron & Dal blue — the shipped look.',
    swatch: ['#E8893A', '#2A5266', '#C9A227'],
    colors: {}, // empty = shipped defaults
  },
  {
    id: 'emerald',
    name: 'Emerald Meadow',
    note: 'Green-forward — meadows & pines.',
    swatch: ['#2F9E63', '#1E5B3A', '#C9A227'],
    colors: {
      saffron: '#2F9E63',
      saffronDeep: '#1F6E45',
      dalBlue: '#1E5B3A',
      dalDeep: '#0F3322',
      emerald: '#2D6A4F',
      mustard: '#C9A227',
      bg: '#F1F0E4',
      raised: '#F5F4E8',
    },
  },
  {
    id: 'sapphire',
    name: 'Dal Sapphire',
    note: 'Cool blues — lake at dusk.',
    swatch: ['#2F6FB0', '#1F4788', '#5AA9C9'],
    colors: {
      saffron: '#2F6FB0',
      saffronDeep: '#1F4788',
      dalBlue: '#1F4788',
      dalDeep: '#10243F',
      sapphire: '#1F4788',
      bg: '#EEF1F5',
      raised: '#F4F7FA',
    },
  },
  {
    id: 'chinar',
    name: 'Chinar Autumn',
    note: 'Warm reds & ambers — October leaves.',
    swatch: ['#D9622D', '#8B3A2E', '#C9A227'],
    colors: {
      saffron: '#D9622D',
      saffronDeep: '#A6431B',
      dalBlue: '#8B3A2E',
      dalDeep: '#4A1E16',
      chinarRed: '#B23A2E',
      chinarAmber: '#D97444',
      mustard: '#C9A227',
      bg: '#F6ECE0',
      raised: '#FAF2E8',
    },
  },
  {
    id: 'pine-winter',
    name: 'Pine Winter',
    note: 'Deep forest greens & frost — premium alpine feel.',
    swatch: ['#1B5E3A', '#0F3D2E', '#5B8A9A'],
    colors: {
      // Brand — rich pine greens for the primary CTA & navigation
      saffron:      '#1B5E3A', // deep pine (primary CTA)
      saffronDeep:  '#0F3D2E', // forest deep (pressed)
      dalBlue:      '#0F3D2E', // forest (brand / headers)
      dalDeep:      '#0A2820', // darkest pine (dark surfaces)

      // Accent variants — every shade stays inside the cool green/blue family
      emerald:      '#2D8659', // vibrant emerald (success)
      sapphire:     '#5B8A9A', // glacier blue (premium)
      chinarAmber:  '#7FB69A', // sage (warnings, softened)
      chinarRed:    '#A8453E', // alpine rust (errors)
      mustard:      '#A88B4D', // muted gold thread
      snowMist:     '#E8EFEC', // frost white
      terra:        '#5C4530', // pine bark brown
      almond:       '#C8E0D1', // mint blossom (spring)
      tulip:        '#A8453E', // alpine red (festival)

      // Surfaces — cool frost whites with a subtle green undertone
      bg:           '#F2F6F4', // snow with hint of green
      surface:      '#FFFFFF',
      raised:       '#E8EFEC', // mint frost (elevated)
      pashmina:     '#E8EFEC', // mint frost base
      pashminaDk:   '#1A2B25', // charcoal-pine

      // Text — deep pine black tones for high legibility
      text:         '#0F1F1A',
      text2:        '#3A4F47',
      text3:        '#6A7A72',

      // Lines — frost hairlines
      line:         '#D5E0DA',
      lineStrong:   '#A8BDB3',
    },
  },
];

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Does the current override map exactly match this preset? */
function matchesPreset(overrides: Record<string, string>, p: Preset): boolean {
  const a = Object.entries(overrides);
  const b = Object.entries(p.colors);
  if (a.length !== b.length) return false;
  return b.every(([k, v]) => (overrides[k] ?? '').toLowerCase() === v.toLowerCase());
}

export default function ThemePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: appTheme.get });

  // Working copy of overrides (only keys that differ from defaults are sent).
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setOverrides(data.colors ?? {});
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => appTheme.update(overrides),
    onSuccess: (res) => {
      qc.setQueryData(QK, res);
      setOverrides(res.colors ?? {});
      setDirty(false);
    },
  });

  const effective = (key: string) => overrides[key] ?? DEFAULTS[key];
  const isOverridden = (key: string) => key in overrides;

  const setColor = (key: string, value: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      // Treat "back to default value" as removing the override.
      if (value.toLowerCase() === (DEFAULTS[key] ?? '').toLowerCase()) {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setDirty(true);
  };

  const revert = (key: string) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDirty(true);
  };

  const resetAll = () => {
    setOverrides({});
    setDirty(true);
  };

  const applyPreset = (p: Preset) => {
    setOverrides({ ...p.colors });
    setDirty(true);
  };

  const overrideCount = Object.keys(overrides).length;
  const hasInvalid = Object.values(overrides).some((v) => !HEX_RE.test(v));

  return (
    <>
      <PageHeader
        title="Theme"
        subtitle="Override the mobile app's colour palette. The app fetches this on launch; empty values fall back to the shipped defaults."
        action={
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost flex items-center gap-1.5" onClick={resetAll} disabled={overrideCount === 0}>
              <ArrowCounterClockwise size={15} weight="bold" /> Reset all
            </button>
            <button
              className="btn btn-primary flex items-center gap-1.5"
              onClick={() => save.mutate()}
              disabled={!dirty || hasInvalid || save.isPending}
            >
              <FloppyDisk size={15} weight="bold" />
              {save.isPending ? 'Saving…' : 'Save theme'}
            </button>
          </div>
        }
      />

      <div className="p-8">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}

        {!isLoading && (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8 items-start">
            {/* ── Editors ─────────────────────────────── */}
            <div className="space-y-6">
              {/* Presets */}
              <div className="card p-5">
                <h2 className="font-serif text-lg font-bold">Presets</h2>
                <p className="text-xs text-ink-3 mb-4">One-click starting points. Pick one, tweak below, then save.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PRESETS.map((p) => {
                    const active = matchesPreset(overrides, p);
                    return (
                      <button
                        key={p.id}
                        onClick={() => applyPreset(p)}
                        className={`text-left rounded-card border p-3 transition-all hover:-translate-y-px ${
                          active ? 'border-dal ring-1 ring-dal/30 bg-pashmina/40' : 'border-line bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-1">
                            {p.swatch.map((c, i) => (
                              <span key={i} className="w-5 h-5 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <span className="font-semibold text-sm">{p.name}</span>
                          {active && <span className="ml-auto text-[10px] font-mono uppercase tracking-wider text-dal">Active</span>}
                        </div>
                        <div className="text-xs text-ink-3 mt-1.5">{p.note}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-sm text-ink-2">
                {overrideCount === 0 ? (
                  <span>Using all shipped defaults.</span>
                ) : (
                  <span>
                    <strong>{overrideCount}</strong> colour{overrideCount === 1 ? '' : 's'} overridden.
                  </span>
                )}
                {hasInvalid && <span className="ml-2 text-chinar font-semibold">Some hex values are invalid.</span>}
              </div>

              {GROUPS.map((g) => (
                <div key={g.heading} className="card p-5">
                  <h2 className="font-serif text-lg font-bold">{g.heading}</h2>
                  <p className="text-xs text-ink-3 mb-4">{g.note}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {g.keys.map(({ key, label }) => {
                      const val = effective(key);
                      const valid = HEX_RE.test(val);
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <label className="relative shrink-0">
                            <span
                              className="block w-9 h-9 rounded-btn border border-line shadow-sm"
                              style={{ backgroundColor: valid ? val : 'transparent' }}
                            />
                            <input
                              type="color"
                              value={valid && val.length === 7 ? val : '#000000'}
                              onChange={(e) => setColor(key, e.target.value.toUpperCase())}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              aria-label={label}
                            />
                          </label>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate flex items-center gap-1.5">
                              {label}
                              {isOverridden(key) && (
                                <button
                                  onClick={() => revert(key)}
                                  title="Revert to default"
                                  className="text-ink-3 hover:text-dal"
                                >
                                  <ArrowCounterClockwise size={12} weight="bold" />
                                </button>
                              )}
                            </div>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) => setColor(key, e.target.value)}
                              spellCheck={false}
                              className={`mt-0.5 w-full font-mono text-xs px-2 py-1 rounded-btn border bg-white ${
                                valid ? 'border-line' : 'border-chinar'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* ── Live preview ────────────────────────── */}
            <div className="sticky top-24">
              <Preview effective={effective} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Preview({ effective }: { effective: (k: string) => string }) {
  const c = effective;
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-line text-xs font-mono uppercase tracking-wider text-ink-3">
        Live preview
      </div>
      <div className="p-5 space-y-4" style={{ backgroundColor: c('bg') }}>
        {/* faux hero */}
        <div className="rounded-card p-4" style={{ backgroundColor: c('dalBlue') }}>
          <div className="text-[11px] font-mono tracking-widest" style={{ color: c('pashmina') }}>
            KASHMIR EXPLORER
          </div>
          <div className="text-xl font-serif font-bold mt-1" style={{ color: c('surface') }}>
            Gangabal
          </div>
          <button
            className="mt-3 px-3 py-1.5 rounded-btn text-sm font-semibold"
            style={{ backgroundColor: c('saffron'), color: '#fff' }}
          >
            Plan a trip
          </button>
        </div>

        {/* faux card */}
        <div className="rounded-card p-4 border" style={{ backgroundColor: c('surface'), borderColor: c('line') }}>
          <div className="font-serif font-bold" style={{ color: c('text') }}>
            Trail conditions
          </div>
          <div className="text-sm mt-0.5" style={{ color: c('text2') }}>
            Open · moderate difficulty
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Pill bg={c('emerald')}>OPEN</Pill>
            <Pill bg={c('mustard')}>MODERATE</Pill>
            <Pill bg={c('chinarRed')}>BLOCKED</Pill>
            <Pill bg={c('sapphire')}>VERIFIED</Pill>
          </div>
          <div className="text-xs mt-3" style={{ color: c('text3') }}>
            Last updated 2h ago
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide" style={{ backgroundColor: bg, color: '#fff' }}>
      {children}
    </span>
  );
}
