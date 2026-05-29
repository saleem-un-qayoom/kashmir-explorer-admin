'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { destinations, type Destination } from '@/lib/api';

const DISTRICTS = [
  'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda',
  'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam',
  'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban',
  'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur',
];
const REGIONS = ['central', 'north', 'south', 'ladakh', 'jammu'];
const SEASONS = ['year-round', 'summer', 'winter', 'spring', 'autumn'];
const CATEGORIES = ['popular', 'adventure', 'nature', 'cultural', 'spiritual', 'hidden-gems'];

export default function NewDestination() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<Destination>>({
    is_published: true,
    categories: [],
  });

  const create = useMutation({
    mutationFn: () => destinations.create(form),
    onSuccess: (res) => {
      router.push(`/destinations/${res.id}`);
    },
  });

  const set = <K extends keyof Destination>(key: K, val: Destination[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  return (
    <>
      <PageHeader
        title="New Destination"
        subtitle="Add a new destination"
        action={
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={() => router.push('/destinations')}>Cancel</button>
            <button className="btn btn-primary" onClick={() => create.mutate()} disabled={create.isPending || !form.name || !form.slug}>
              {create.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        }
      />

      {create.isError && (
        <div className="mx-8 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {(create.error as Error).message}
        </div>
      )}

      <div className="p-8 max-w-2xl">
        <div className="card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Name <span className="text-chinar">*</span></label>
              <input className="input" value={form.name ?? ''} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Slug <span className="text-chinar">*</span></label>
              <input className="input font-mono" value={form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} placeholder="dal-lake" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">District</label>
              <select className="input" value={form.district ?? ''} onChange={(e) => set('district', e.target.value)}>
                <option value="">Select...</option>
                {DISTRICTS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Region</label>
              <select className="input" value={form.region_slug ?? ''} onChange={(e) => set('region_slug' as any, e.target.value)}>
                <option value="">Select...</option>
                {REGIONS.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Tagline</label>
            <input className="input" value={form.tagline ?? ''} onChange={(e) => set('tagline', e.target.value)} placeholder="Short one-liner" />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Season</label>
            <select className="input" value={form.season_type ?? ''} onChange={(e) => set('season_type', e.target.value)}>
              <option value="">Select...</option>
              {SEASONS.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const active = form.categories?.includes(cat);
                return (
                  <button key={cat} type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${active ? 'bg-dal text-white border-dal' : 'bg-white text-ink-2 border-line'}`}
                    onClick={() => {
                      const cats = form.categories ?? [];
                      set('categories', active ? cats.filter((x) => x !== cat) : [...cats, cat]);
                    }}
                  >{cat}</button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_published ?? false} onChange={(e) => set('is_published', e.target.checked)} className="accent-dal w-4 h-4" />
            <span className="text-sm font-medium">Published</span>
          </label>
        </div>
      </div>
    </>
  );
}
