'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Eye, EyeSlash } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { Input, Textarea, Select } from '@/components/FormControls';
import { api, homeHero, type HomeHeroBanner, type HeroLinkType } from '@/lib/api';

const QK = ['home-hero'];

const LINK_TYPE_OPTIONS = [
  { value: 'none', label: 'No link (decorative)' },
  { value: 'destination', label: 'Destination (slug)' },
  { value: 'trek', label: 'Trek (slug)' },
  { value: 'screen', label: 'App screen (route path)' },
];

export default function HomeHeroPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: homeHero.list });
  const [edit, setEdit] = useState<HomeHeroBanner | null>(null);
  const [show, setShow] = useState(false);

  const banners = data ?? [];

  const del = useMutation({
    mutationFn: (id: string) => homeHero.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
  const patch = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<HomeHeroBanner> }) => homeHero.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });

  // Reorder by swapping sort_order with the neighbour.
  const move = (idx: number, dir: -1 | 1) => {
    const a = banners[idx];
    const b = banners[idx + dir];
    if (!a || !b) return;
    patch.mutate({ id: a.id, body: { sort_order: b.sort_order } });
    patch.mutate({ id: b.id, body: { sort_order: a.sort_order } });
  };

  return (
    <>
      <PageHeader
        title="Home hero"
        subtitle="Curated carousel shown at the top of the mobile home screen · order, caption, and link are independent of any destination."
        action={
          <button className="btn btn-primary" onClick={() => { setEdit(null); setShow(true); }}>
            + New hero banner
          </button>
        }
      />

      <div className="p-8">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}
        {!isLoading && banners.length === 0 && (
          <div className="card p-8 text-center text-ink-2">
            No hero banners yet. Add one to control the home-screen hero.
          </div>
        )}

        <div className="space-y-3">
          {banners.map((b, i) => (
            <div key={b.id} className={`card p-4 flex items-center gap-4 ${b.is_active ? '' : 'opacity-60'}`}>
              <div className="flex flex-col gap-1">
                <button className="text-ink-3 hover:text-dal disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} weight="bold" />
                </button>
                <button className="text-ink-3 hover:text-dal disabled:opacity-30" disabled={i === banners.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} weight="bold" />
                </button>
              </div>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image_url} alt={b.title ?? ''} className="w-40 h-24 object-cover rounded-btn border border-line bg-pashmina/20" />

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate">{b.title || <span className="text-ink-3 italic">Untitled</span>}</div>
                {b.subtitle && <div className="text-sm text-ink-2 truncate">{b.subtitle}</div>}
                <div className="font-mono text-[10px] text-ink-3 mt-1 tracking-wider">
                  {b.link_type === 'none' ? 'NO LINK' : `${b.link_type.toUpperCase()} · ${b.link_value || '—'}`} · #{b.sort_order}
                </div>
              </div>

              <button
                className={`pill ${b.is_active ? 'pill-info' : 'pill-neutral'} flex items-center gap-1`}
                onClick={() => patch.mutate({ id: b.id, body: { is_active: !b.is_active } })}
                title={b.is_active ? 'Active — visible on home' : 'Hidden'}
              >
                {b.is_active ? <Eye size={13} /> : <EyeSlash size={13} />}
                {b.is_active ? 'Active' : 'Hidden'}
              </button>

              <div className="flex gap-2">
                <button className="text-xs font-semibold text-dal" onClick={() => { setEdit(b); setShow(true); }}>EDIT</button>
                <button className="text-xs font-semibold text-chinar" onClick={() => del.mutate(b.id)}>DELETE</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {show && (
        <HeroModal
          initial={edit}
          nextSort={banners.length}
          onClose={() => setShow(false)}
          onSaved={() => { qc.invalidateQueries({ queryKey: QK }); setShow(false); }}
        />
      )}
    </>
  );
}

function HeroModal({
  initial, nextSort, onClose, onSaved,
}: {
  initial: HomeHeroBanner | null;
  nextSort: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partial<HomeHeroBanner>>(
    initial ?? { image_url: '', title: '', subtitle: '', link_type: 'none', link_value: '', sort_order: nextSort, is_active: true },
  );
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof HomeHeroBanner>(key: K, val: HomeHeroBanner[K]) => setForm((f) => ({ ...f, [key]: val }));

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const res = await api.post('upload/presign', {
        json: { filename: file.name, contentType: file.type },
      }).json() as { data?: { upload_url: string; public_url: string } };
      if (!res.data?.upload_url) throw new Error('No upload URL');
      await fetch(res.data.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      set('image_url', res.data.public_url);
    } catch (e) { console.error('Upload failed', e); }
    setUploading(false);
  };

  const save = useMutation({
    mutationFn: async () => {
      const body = { ...form, sort_order: form.sort_order ?? nextSort };
      if (initial) await homeHero.update(initial.id, body);
      else await homeHero.create(body);
    },
    onSuccess: onSaved,
  });

  const canSave = !!form.image_url && !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-card shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-heading text-sm tracking-wider text-ink-3 mb-4">{initial ? 'EDIT HERO BANNER' : 'NEW HERO BANNER'}</h2>

        <div className="space-y-4">
          {/* Image */}
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Image *</label>
            <div
              className="border-2 border-dashed border-line hover:border-dal/50 rounded-btn p-4 text-center cursor-pointer transition"
              onClick={() => inputRef.current?.click()}
            >
              {form.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image_url} alt="" className="w-full h-40 object-cover rounded-btn" />
              ) : (
                <span className="text-sm text-ink-2">{uploading ? 'Uploading…' : 'Drop image or click to upload'}</span>
              )}
              <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
            {form.image_url && <button className="text-[11px] text-dal mt-1" onClick={() => inputRef.current?.click()}>Replace image</button>}
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Title</label>
            <Input value={form.title ?? ''} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Dal Lake" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ink-2 mb-1">Subtitle</label>
            <Textarea className="min-h-[60px]" value={form.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} placeholder="Optional caption" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">Tap action</label>
              <Select options={LINK_TYPE_OPTIONS} value={form.link_type} onChange={(v) => set('link_type', v as HeroLinkType)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-2 mb-1">
                {form.link_type === 'screen' ? 'Route path' : 'Slug'}
              </label>
              <Input
                value={form.link_value ?? ''}
                disabled={form.link_type === 'none'}
                onChange={(e) => set('link_value', e.target.value)}
                placeholder={form.link_type === 'screen' ? '/weather' : 'gulmarg'}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={form.is_active ?? true} onChange={(e) => set('is_active', e.target.checked)} />
            Active (visible on home screen)
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canSave || save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
