'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type DragEvent } from 'react';
import { images, resolveMediaUrl } from '@/lib/api';

export function ImageUploader({ entityType, entityId }: { entityType: 'destination' | 'trek' | 'photo_spot'; entityId: string }) {
  const qc = useQueryClient();
  const qkPrefix =
    entityType === 'destination' ? 'images-dest' : entityType === 'trek' ? 'images-trek' : 'images-spot';
  const qk = [qkPrefix, entityId];
  const { data } = useQuery({
    queryKey: qk,
    queryFn: () =>
      entityType === 'destination'
        ? images.forDestination(entityId)
        : entityType === 'trek'
          ? images.forTrek(entityId)
          : images.forPhotoSpot(entityId),
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const del = useMutation({
    mutationFn: (id: string) => images.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk }),
  });
  const heroMut = useMutation({
    mutationFn: ({ id, is_hero }: { id: string; is_hero: boolean }) => images.update(id, { is_hero }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk }),
  });
  const captionMut = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) => images.update(id, { caption }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk }),
  });

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setUploading(true);
    setError(null);
    try {
      // Bytes are stored directly in the DB; the backend creates the image row
      // (linked to this destination/trek) and returns its serve URL.
      const isFirst = (data?.length ?? 0) === 0;
      await images.upload(entityType, entityId, file, { is_hero: isFirst });
      qc.invalidateQueries({ queryKey: qk });
    } catch (e) {
      console.error('Upload failed', e);
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
    setUploading(false);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          dragOver
            ? 'border-kong bg-kong/10 dark:bg-kong/15'
            : 'border-slate-300 dark:border-slate-600 hover:border-kong/50 dark:hover:border-kong hover:bg-slate-50 dark:hover:bg-slate-900/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <span className="text-sm font-semibold text-kong dark:text-kong/50">Uploading…</span>
        ) : (
          <>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop images here or click to upload</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 10MB each</p>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">⚠️ {error}</p>}
      {(data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {data?.map((img) => (
            <div key={img.id} className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveMediaUrl(img.url)} alt={img.caption ?? ''} className="w-full h-32 object-cover" />
              {img.is_hero && (
                <span className="absolute top-2 left-2 text-[11px] bg-kong text-white px-2 py-1 rounded-full font-bold">
                  ⭐ HERO
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  className="text-[10px] bg-white text-slate-900 px-2.5 py-1 rounded font-semibold transition-all hover:bg-slate-100"
                  onClick={() => heroMut.mutate({ id: img.id, is_hero: !img.is_hero })}
                >
                  {img.is_hero ? '✓ Hero' : '☆ Hero'}
                </button>
                <button
                  className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-semibold transition-all"
                  onClick={() => del.mutate(img.id)}
                >
                  🗑️ Remove
                </button>
              </div>
              <input
                className="w-full text-[10px] px-2 py-1 border-t border-slate-200 dark:border-slate-700 outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-all focus:ring-1 focus:ring-kong"
                defaultValue={img.caption ?? ''}
                onBlur={(e) => { if (e.target.value !== (img.caption ?? '')) captionMut.mutate({ id: img.id, caption: e.target.value }); }}
                placeholder="Add caption…"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
