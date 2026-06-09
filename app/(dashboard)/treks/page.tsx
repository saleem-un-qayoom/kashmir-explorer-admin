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
import {
  Eye,
  PencilLine,
  TrashSimple,
  XCircle,
  Tent,
  Mountains,
  Ruler,
  ArrowFatUp,
  MapPin,
  Compass,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { PageHeader } from '@/components/PageHeader';
import { Input, Select } from '@/components/FormControls';
import { treks, type Trek } from '@/lib/api';
import {
  FeatureChips,
  TRAIL_FEATURES,
  TRAIL_ACTIVITIES,
} from '@/components/FeatureChips';

const DIFFICULTIES = ['easy', 'moderate', 'hard', 'strenuous'] as const;

export default function TreksPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['treks-admin'],
    queryFn: treks.adminList,
    placeholderData: (prev) => prev,
  });
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filtered = useMemo(() => {
    return (data ?? []).filter((t) => {
      if (difficulty && t.difficulty !== difficulty) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (features.length && !features.every((f) => t.features?.includes(f)))
        return false;
      if (
        activities.length &&
        !activities.some((a) => t.activities?.includes(a))
      )
        return false;
      return true;
    });
  }, [data, difficulty, statusFilter, features, activities]);

  const columns = useMemo(
    () => buildColumns(router, del.mutate),
    [router, del.mutate],
  );
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

  const filterCount =
    (difficulty ? 1 : 0) +
    (statusFilter ? 1 : 0) +
    features.length +
    activities.length;

  return (
    <>
      <PageHeader
        title="Treks"
        subtitle={`${data?.length ?? 0} routes · ${
          data?.filter((t) => t.status === 'open').length ?? 0
        } currently open · ${filtered.length} match`}
        action={
          <button
            className="btn btn-primary"
            onClick={() => router.push('/treks/new')}
          >
            + New trek
          </button>
        }
      />

      <div className="p-8 space-y-4">
        {/* Search + simple filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="relative flex-1 max-w-md">
            <Compass
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search treks…"
              className="pl-9"
            />
          </div>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="btn btn-ghost text-xs px-3"
            >
              <XCircle size={14} />
              Clear
            </button>
          )}
          <Select
            options={[
              { value: '', label: 'All difficulties' },
              ...DIFFICULTIES.map((d) => ({ value: d, label: d })),
            ]}
            value={difficulty}
            onChange={setDifficulty}
            placeholder="All difficulties"
          />
          <Select
            options={[
              { value: '', label: 'Any status' },
              ...[
                { value: 'open', label: 'Open' },
                { value: 'closing-soon', label: 'Closing soon' },
                { value: 'closed', label: 'Closed' },
              ].map((s) => ({ value: s.value, label: s.label })),
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Any status"
          />
          <button
            onClick={() => setShowAdvanced((s) => !s)}
            className={`btn btn-ghost text-xs flex items-center gap-1.5 ${
              showAdvanced || filterCount > 0 ? 'text-dal' : ''
            }`}
          >
            <SlidersHorizontal size={14} />
            Advanced
            {filterCount > 0 && (
              <span className="pill pill-saffron text-[9px] ml-1">
                {filterCount}
              </span>
            )}
          </button>
          <div className="font-mono text-[10px] text-ink-3 tracking-wider ml-auto">
            {table.getRowModel().rows.length} of {data?.length ?? 0} rows
          </div>
        </div>

        {/* Advanced filters */}
        {showAdvanced && (
          <div className="animate-rise card p-4">
            <div className="space-y-4">
              <div>
                <div className="text-[10px] tracking-wider font-mono text-ink-3 mb-2">
                  FEATURES
                </div>
                <FeatureChips
                  value={features}
                  options={TRAIL_FEATURES}
                  onChange={setFeatures}
                />
              </div>
              <div>
                <div className="text-[10px] tracking-wider font-mono text-ink-3 mb-2">
                  ACTIVITIES
                </div>
                <FeatureChips
                  value={activities}
                  options={TRAIL_ACTIVITIES}
                  onChange={setActivities}
                />
              </div>
              {filterCount > 0 && (
                <button
                  onClick={() => {
                    setFeatures([]);
                    setActivities([]);
                    setDifficulty('');
                    setStatusFilter('');
                  }}
                  className="text-xs text-chinar font-medium tracking-wide hover:text-chinar/80 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div
          className={`card overflow-hidden transition-all duration-300 ${
            isFetching && !isLoading ? 'opacity-60' : 'opacity-100'
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="bg-pashmina/30 border-b border-line">
                    {hg.headers.map((h) => (
                      <th
                        key={h.id}
                        className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3 cursor-pointer select-none transition-colors duration-150 hover:text-ink"
                        onClick={h.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1.5">
                          {flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )}
                          {h.column.getIsSorted() && (
                            <span className="text-dal text-xs">
                              {h.column.getIsSorted() === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={9} className="px-4 py-12">
                      <div className="space-y-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} className="flex gap-4">
                            <div className="skeleton h-5 w-48" />
                            <div className="skeleton h-5 w-24" />
                            <div className="skeleton h-5 w-12" />
                            <div className="skeleton h-5 w-16" />
                            <div className="skeleton h-5 w-20" />
                            <div className="skeleton h-5 w-20" />
                            <div className="skeleton h-5 w-16" />
                            <div className="skeleton h-5 w-24" />
                            <div className="skeleton h-5 w-32" />
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pashmina/50">
                          <Mountains size={24} className="text-ink-3" />
                        </div>
                        <div className="font-quote italic text-lg text-ink-2">
                          {search
                            ? 'No treks match that search.'
                            : 'No treks yet.'}
                        </div>
                        {!search && (
                          <button
                            className="btn btn-primary mt-2"
                            onClick={() => router.push('/treks/new')}
                          >
                            + Add your first trek
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {!isLoading && filtered.length > 0 && (
              <table className="w-full text-sm stagger">
                <tbody>
                  {table.getRowModel().rows.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => router.push(`/treks/${row.original.id}`)}
                      className="group border-b border-line last:border-0 hover:bg-pashmina/40 cursor-pointer transition-all duration-200"
                      style={{ animationDelay: `${0.03 * i}s` }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3.5 transition-colors">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer stats */}
          {!isLoading && data && data.length > 0 && (
            <div className="flex items-center justify-between border-t border-line bg-pashmina/20 px-4 py-2.5">
              <div className="font-mono text-[10px] tracking-wider text-ink-3">
                {filtered.length} trek{filtered.length === 1 ? '' : 's'}
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <Ruler size={11} className="text-ink-3" />
                  <span className="font-mono text-[10px] text-ink-3">
                    Ø{' '}
                    {data.length
                      ? `${(
                          data.reduce(
                            (s, t) => s + (t.distance_km ?? 0),
                            0,
                          ) / data.length
                        ).toFixed(0)}km`
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowFatUp size={11} className="text-ink-3" />
                  <span className="font-mono text-[10px] text-ink-3">
                    Max{' '}                  {data.length
                        ? Math.max(
                            ...data.map((t) => t.max_altitude_m ?? 0),
                          )?.toLocaleString() ?? '—'
                        : '—'}
                    m
                  </span>
                </div>
              </div>
            </div>
          )}
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
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-dal/20 to-dal/5 text-dal text-xs font-bold shrink-0">
            <Tent size={14} weight="fill" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate group-hover:text-dal transition-colors duration-150">
              {i.getValue()}
            </div>
            <div className="font-mono text-[10px] text-ink-3 mt-0.5 tracking-wide truncate">
              /{i.row.original.slug}
            </div>
          </div>
        </div>
      ),
    }),
    ch.accessor('difficulty', {
      header: 'Difficulty',
      cell: (i) => {
        const d = i.getValue();
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              d === 'easy'
                ? 'bg-emerald/10 text-emerald'
                : d === 'moderate'
                  ? 'bg-amber/10 text-amber'
                  : 'bg-chinar/10 text-chinar'
            }`}
          >
            <Mountains size={10} />
            {d.toUpperCase()}
          </span>
        );
      },
    }),
    ch.accessor('duration_days', {
      header: 'Days',
      cell: (i) => <span className="font-mono">{i.getValue()}d</span>,
    }),
    ch.accessor('distance_km', {
      header: 'Distance',
      cell: (i) => (
        <span className="font-mono text-xs text-ink-2">
          {i.getValue() ? `${i.getValue()}km` : '—'}
        </span>
      ),
    }),
    ch.accessor('elevation_gain_m', {
      header: () => (
        <span className="inline-flex items-center gap-1">
          <ArrowFatUp size={10} />
          Gain
        </span>
      ),
      cell: (i) => (
        <span className="font-mono text-xs">
          {i.getValue() ? `${i.getValue()}m` : '—'}
        </span>
      ),
    }),
    ch.accessor('max_altitude_m', {
      header: () => (
        <span className="inline-flex items-center gap-1">
          <MapPin size={10} />
          Max alt
        </span>
      ),
      cell: (i) => (
        <span className="font-mono">
          {i.getValue()?.toLocaleString() ?? '—'}m
        </span>
      ),
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
      cell: (i) => {
        const s = i.getValue();
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              s === 'open'
                ? 'bg-emerald/10 text-emerald'
                : s === 'closing-soon'
                  ? 'bg-amber/10 text-amber'
                  : 'bg-chinar/10 text-chinar'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                s === 'open'
                  ? 'bg-emerald'
                  : s === 'closing-soon'
                    ? 'bg-amber'
                    : 'bg-chinar'
              }`}
            />
            {s.toUpperCase().replace('-', ' ')}
          </span>
        );
      },
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: (i) => (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-dal/10 hover:text-dal transition-all duration-150"
            title="View"
            onClick={() => router.push(`/treks/view/${i.row.original.id}`)}
          >
            <Eye size={15} />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-kong/10 hover:text-kong transition-all duration-150"
            title="Edit"
            onClick={() => router.push(`/treks/${i.row.original.id}`)}
          >
            <PencilLine size={15} />
          </button>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 hover:bg-chinar/10 hover:text-chinar transition-all duration-150"
            title="Delete"
            onClick={() => {
              if (confirm(`Delete "${i.row.original.name}"?`))
                onDelete(i.row.original.id);
            }}
          >
            <TrashSimple size={15} />
          </button>
        </div>
      ),
    }),
  ];
}
