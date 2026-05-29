'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState, type DragEvent } from 'react';
import { api, images } from '@/lib/api';

export function ImageUploader({ entityType, entityId }: { entityType: 'destination' | 'trek'; entityId: string }) {
  const qc = useQueryClient();
  const qk = [entityType === 'destination' ? 'images-dest' : 'images-trek', entityId];
  const { data } = useQuery({ queryKey: qk, queryFn: () => images.forDestination(entityId) });
  const [uploading, setUploading] = useState(false);
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
    try {
      const res = await api.post('upload/presign', {
        json: { filename: file.name, contentType: file.type },
      }).json() as { data?: { upload_url: string; public_url: string } };
      if (!res.data?.upload_url) throw new Error('No upload URL');
      await fetch(res.data.upload_url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      const field = entityType === 'destination' ? 'destination_id' : 'trek_id';
      await images.create({ [field]: entityId, url: res.data.public_url });
      qc.invalidateQueries({ queryKey: qk });
    } catch (e) { console.error('Upload failed', e); }
    setUploading(false);
  };

  const onDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-btn p-4 text-center cursor-pointer transition ${
          dragOver ? 'border-dal bg-dal/10' : 'border-line hover:border-dal/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <span className="text-sm text-ink-2">Uploading…</span>
        ) : (
          <span className="text-sm text-ink-2">Drop image here or click to upload</span>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {(data?.length ?? 0) > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {data?.map((img) => (
            <div key={img.id} className="group relative rounded-btn overflow-hidden border border-line bg-pashmina/20">
              <img src={img.url} alt={img.caption ?? ''} className="w-full h-24 object-cover" />
              {img.is_hero && <span className="absolute top-1 left-1 text-[10px] bg-dal text-white px-1.5 py-0.5 rounded font-bold">HERO</span>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button className="text-[10px] bg-white text-ink-1 px-2 py-1 rounded" onClick={() => heroMut.mutate({ id: img.id, is_hero: !img.is_hero })}>
                  {img.is_hero ? 'Unset' : 'Hero'}
                </button>
                <button className="text-[10px] bg-chinar text-white px-2 py-1 rounded" onClick={() => del.mutate(img.id)}>
                  Del
                </button>
              </div>
              <input
                className="w-full text-[10px] px-1 py-0.5 border-t border-line outline-none"
                defaultValue={img.caption ?? ''}
                onBlur={(e) => { if (e.target.value !== (img.caption ?? '')) captionMut.mutate({ id: img.id, caption: e.target.value }); }}
                placeholder="Caption…"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
