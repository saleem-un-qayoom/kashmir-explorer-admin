'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FloppyDisk, Mountains } from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { mapConfig } from '@/lib/api';

const QK = ['map-config'];

export default function MapEnginePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: QK, queryFn: mapConfig.get });

  const [exaggeration, setExaggeration] = useState(1.5);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) {
      setExaggeration(data.terrain_exaggeration);
      setDirty(false);
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => mapConfig.update({ terrain_exaggeration: exaggeration }),
    onSuccess: (res) => {
      qc.setQueryData(QK, res);
      setExaggeration(res.terrain_exaggeration);
      setDirty(false);
    },
  });

  return (
    <>
      <PageHeader
        title="Map settings"
        subtitle="Tune the terrain relief for the mobile app's native MapLibre maps."
        action={
          <button
            className="btn btn-primary flex items-center gap-1.5"
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending}
          >
            <FloppyDisk size={15} weight="bold" />
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        }
      />

      <div className="p-8 max-w-3xl">
        {isLoading && <div className="font-quote italic text-ink-2">Loading…</div>}

        {!isLoading && (
          <div className="space-y-6">
            <div className="card p-5">
              <div className="flex items-center gap-2.5 mb-1">
                <Mountains size={22} weight="duotone" className="text-dal" />
                <h2 className="font-serif text-lg font-bold">Terrain exaggeration</h2>
              </div>
              <p className="text-xs text-ink-3 mb-4">
                Scales how dramatic the relief looks on the mobile app's topo map. 1× is
                true-to-life; higher makes ridges stand out. Applied to the hillshade layer.
              </p>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={3}
                  step={0.1}
                  value={exaggeration}
                  onChange={(e) => {
                    setExaggeration(Number(e.target.value));
                    setDirty(true);
                  }}
                  className="flex-1"
                />
                <span className="font-mono text-sm w-12 text-right">{exaggeration.toFixed(1)}×</span>
              </div>
            </div>

            {save.isError && (
              <div className="text-sm text-chinar font-semibold">
                Couldn&apos;t save — check you&apos;re signed in and try again.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
