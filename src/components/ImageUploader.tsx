'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { images, resolveMediaUrl } from '@/lib/api';

export function ImageUploader({
  entityType,
  entityId,
  canUpload = true,
}: {
  entityType: 'destination' | 'trek' | 'photo_spot';
  entityId: string;
  /** When false, hides the upload dropzone — existing images can still be managed. */
  canUpload?: boolean;
}) {
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
      {canUpload && (
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
      )}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400 font-semibold">⚠️ {error}</p>}
      {!canUpload && (data?.length ?? 0) === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">No images. Images can only be added when a destination is created.</p>
      )}
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

/**
 * Local file picker used while creating an entity that doesn't have an id yet.
 * Files are staged in memory (with previews) and uploaded by the caller after
 * the entity is created. First file becomes the hero image.
 */
export function StagedImagePicker({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const addFiles = (list: FileList | File[]) => {
    const imgs = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (imgs.length) onChange([...files, ...imgs]);
  };
  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };

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
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Drop images here or click to select</span>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">PNG, JPG up to 10MB each — uploaded when you press Create</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
        />
      </div>
      {files.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previews[i]} alt={f.name} className="w-full h-32 object-cover" />
              {i === 0 && (
                <span className="absolute top-2 left-2 text-[11px] bg-kong text-white px-2 py-1 rounded-full font-bold">
                  ⭐ HERO
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded font-semibold transition-all"
                  onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                >
                  🗑️ Remove
                </button>
              </div>
              <p className="w-full text-[10px] px-2 py-1 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 truncate">{f.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
