'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table';
import { PageHeader } from '@/components/PageHeader';
import { treks, type Trek } from '@/lib/api';
import {
  FeatureChips,
  TRAIL_FEATURES,
  TRAIL_ACTIVITIES,
} from '@/components/FeatureChips';

export default function TreksPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['treks-admin'], queryFn: treks.adminList });
  const del = useMutation({
    mutationFn: (id: string) => treks.adminRemove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treks-admin'] }),
  });

  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filtered = useMemo(() => {
    return (data ?? []).filter((t) => {
      if (difficulty && t.difficulty !== difficulty) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (features.length && !features.every((f) => t.features?.includes(f))) return false;
      if (activities.length && !activities.some((a) => t.activities?.includes(a))) return false;
      return true;
    });
  }, [data, difficulty, statusFilter, features, activities]);

  const columns = useMemo(() => buildColumns(router, del.mutate), [router, del.mutate]);
  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearch,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <>
      <PageHeader
        title="Treks"
        subtitle={`${data?.length ?? 0} routes · ${data?.filter((t) => t.status === 'open').length ?? 0} currently open · ${filtered.length} match`}
        action={
          <button className="btn btn-primary" onClick={() => router.push('/treks/new')}>
            + New trek
          </button>
        }
      />

      <div className="p-8 space-y-4">
        {/* Search + simple filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search treks…"
            className="input flex-1 max-w-md"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input"
          >
            <option value="">All difficulties</option>
            {['easy', 'moderate', 'hard', 'strenuous'].map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Any status</option>
            {['open', 'closing-soon', 'closed'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* AllTrails-style feature + activity filter chips */}
        <details className="card p-4">
          <summary className="cursor-pointer text-sm font-medium text-ink select-none">
            Advanced filters
            {(features.length + activities.length) > 0 && (
              <span className="ml-2 pill pill-saffron">
                {features.length + activities.length} ON
              </span>
            )}
          </summary>
          <div className="mt-4 space-y-4">
            <div>
              <div className="text-[10px] tracking-wider font-mono text-ink-3 mb-2">FEATURES</div>
              <FeatureChips value={features} options={TRAIL_FEATURES} onChange={setFeatures} />
            </div>
            <div>
              <div className="text-[10px] tracking-wider font-mono text-ink-3 mb-2">ACTIVITIES</div>
              <FeatureChips value={activities} options={TRAIL_ACTIVITIES} onChange={setActivities} />
            </div>
            {(features.length + activities.length) > 0 && (
              <button
                onClick={() => { setFeatures([]); setActivities([]); }}
                className="text-xs text-chinar font-medium tracking-wide"
              >
                Clear all filters
              </button>
            )}
          </div>
        </details>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-pashmina/30 border-b border-line">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3 cursor-pointer select-none"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' && ' ↑'}
                      {h.column.getIsSorted() === 'desc' && ' ↓'}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center font-quote italic text-ink-2">
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <div className="font-quote italic text-xl text-ink-2">
                      “No treks match those filters.”
                    </div>
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/treks/${row.original.id}`)}
                  className="border-b border-line last:border-0 hover:bg-pashmina/40 cursor-pointer transition"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─── columns ───────────────────────────────────────────── */

const ch = createColumnHelper<Trek>();

function buildColumns(
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => void,
) {
  return [
    ch.accessor('name', {
      header: 'Name',
      cell: (i) => (
        <div>
          <div className="font-semibold">{i.getValue()}</div>
          <div className="font-mono text-[10px] text-ink-3 mt-0.5">{i.row.original.slug}</div>
        </div>
      ),
    }),
    ch.accessor('difficulty', {
      header: 'Difficulty',
      cell: (i) => (
        <span
          className={`badge badge-${
            i.getValue() === 'easy' ? 'success'
            : i.getValue() === 'moderate' ? 'warning'
            : 'danger'
          }`}
        >
          {i.getValue().toUpperCase()}
        </span>
      ),
    }),
    ch.accessor('duration_days', {
      header: 'Days',
      cell: (i) => <span className="font-mono">{i.getValue()}D</span>,
    }),
    ch.accessor('distance_km', {
      header: 'KM',
      cell: (i) => <span className="font-mono text-xs">{i.getValue() ?? '—'}</span>,
    }),
    ch.accessor('elevation_gain_m', {
      header: '↑ Gain',
      cell: (i) => (
        <span className="font-mono text-xs">{i.getValue() ? `${i.getValue()}m` : '—'}</span>
      ),
    }),
    ch.accessor('max_altitude_m', {
      header: 'Max alt',
      cell: (i) => <span className="font-mono">{i.getValue()?.toLocaleString() ?? '—'}m</span>,
    }),
    ch.accessor('route_type', {
      header: 'Route',
      cell: (i) => (
        <span className="font-mono text-[10px] text-ink-2 tracking-wider">
          {(i.getValue() ?? '—').toUpperCase()}
        </span>
      ),
    }),
    ch.accessor('status', {
      header: 'Status',
      cell: (i) => (
        <span
          className={`pill ${
            i.getValue() === 'open' ? 'pill-success'
            : i.getValue() === 'closing-soon' ? 'pill-warning'
            : 'pill-danger'
          }`}
        >
          {i.getValue().toUpperCase().replace('-', ' ')}
        </span>
      ),
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: (i) => (
        <div
          onClick={(e) => e.stopPropagation()}
          className="text-right whitespace-nowrap"
        >
          <button
            className="btn btn-ghost text-xs"
            onClick={() => router.push(`/treks/${i.row.original.id}`)}
          >
            Edit
          </button>
          <button
            className="btn btn-ghost text-xs text-chinar"
            onClick={() => {
              if (confirm(`Delete "${i.row.original.name}"?`)) onDelete(i.row.original.id);
            }}
          >
            Delete
          </button>
        </div>
      ),
    }),
  ];
}
