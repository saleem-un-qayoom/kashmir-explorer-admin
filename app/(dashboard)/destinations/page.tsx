'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { destinations, type Destination } from '@/lib/api';

type Tab = 'published' | 'unpublished' | 'deleted' | 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'unpublished', label: 'Unpublished' },
  { key: 'deleted', label: 'Deleted' },
];

export default function DestinationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('published');
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const isDeletedTab = tab === 'deleted';

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['destinations-admin', tab],
    queryFn: () => destinations.adminList(tab === 'all' ? undefined : tab),
    // Keep previous tab's data visible while new tab fetches — no empty flash.
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const remove = useMutation({
    mutationFn: (id: string) => destinations.adminRemove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinations-admin'] }),
  });

  const restore = useMutation({
    mutationFn: (id: string) => destinations.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinations-admin'] }),
  });

  const deletePermanent = useMutation({
    mutationFn: (id: string) => destinations.deletePermanent(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['destinations-admin'] }),
  });

  const columns = useMemo(
    () => buildColumns(router, remove.mutate, restore.mutate, deletePermanent.mutate, isDeletedTab),
    [router, remove.mutate, restore.mutate, deletePermanent.mutate, isDeletedTab],
  );

  const table = useReactTable({
    data: data ?? [],
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
        title="Destinations"
        subtitle={`${data?.length ?? 0} ${tab === 'deleted' ? 'deleted' : tab === 'all' ? 'total' : tab}`}
        action={
          <button className="btn btn-primary" onClick={() => router.push('/destinations/new')}>
            + New destination
          </button>
        }
      />

      <div className="px-8">
        <div className="flex gap-1 border-b border-line mb-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition -mb-px inline-flex items-center gap-1.5 ${
                tab === t.key
                  ? 'border-dal text-dal'
                  : 'border-transparent text-ink-3 hover:text-ink'
              }`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {tab === t.key && isFetching && (
                <span className="inline-block w-3 h-3 rounded-full border-2 border-dal border-t-transparent animate-spin" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 space-y-4">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search destinations…"
            className="rounded-btn border border-line bg-white px-4 py-2 text-sm focus:outline-none focus:border-dal flex-1 max-w-md"
          />
        </div>

        <div className={`card overflow-hidden transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-line bg-pashmina/30">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      className="text-left px-4 py-3 font-mono text-[10px] tracking-wider text-ink-3 cursor-pointer"
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
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-ink-2 font-quote italic"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-ink-2 font-quote italic"
                  >
                    No destinations match.
                  </td>
                </tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-0 hover:bg-pashmina/20 cursor-pointer"
                  onClick={() => router.push(`/destinations/view/${row.original.id}`)}
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

const ch = createColumnHelper<Destination>();

function buildColumns(
  router: ReturnType<typeof useRouter>,
  onDelete: (id: string) => void,
  onRestore: (id: string) => void,
  onDeletePermanent: (id: string) => void,
  isDeletedTab: boolean,
) {
  return [
    ch.accessor('name', {
      header: 'Name',
      cell: (info) => (
        <div>
          <div className="font-semibold">{info.getValue()}</div>
          <div className="font-mono text-[10px] text-ink-3 mt-0.5 tracking-wide">{info.row.original.slug}</div>
        </div>
      ),
    }),
    ch.accessor('district', { header: 'District', cell: (i) => i.getValue() ?? '—' }),
    ch.accessor('altitude_m', { header: 'Alt (m)', cell: (i) => i.getValue() ?? '—' }),
    ch.accessor('rating', {
      header: 'Rating',
      cell: (i) => <span className="font-mono">★ {i.getValue().toFixed(1)}</span>,
    }),
    ch.accessor('review_count', { header: 'Reviews', cell: (i) => i.getValue().toLocaleString('en-IN') }),
    ch.accessor('categories', {
      header: 'Categories',
      cell: (i) => (
        <div className="flex gap-1 flex-wrap">
          {(i.getValue() ?? []).map((c) => (
            <span key={c} className="pill pill-neutral">{c}</span>
          ))}
        </div>
      ),
    }),
    ch.accessor('permits', {
      header: 'Permit',
      cell: (i) =>
        i.getValue()?.length ? (
          <span className="badge badge-info">{(i.getValue() ?? []).join(', ')}</span>
        ) : (
          '—'
        ),
    }),
    ch.accessor('is_published', {
      header: 'Status',
      cell: (i) =>
        i.row.original.is_deleted ? (
          <span className="badge badge-neutral">Deleted</span>
        ) : i.getValue() ? (
          <span className="badge badge-success">Published</span>
        ) : (
          <span className="badge badge-neutral">Draft</span>
        ),
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/destinations/view/${row.original.id}`)}>
            View
          </button>
          {isDeletedTab ? (
            <>
              <button className="btn btn-ghost text-xs text-dal" onClick={() => onRestore(row.original.id)}>
                Restore
              </button>
              <button
                className="btn btn-ghost text-xs text-chinar"
                onClick={() => { if (confirm('Permanently delete this destination? This cannot be undone.')) onDeletePermanent(row.original.id); }}
              >
                Delete permanently
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost text-xs" onClick={() => router.push(`/destinations/${row.original.id}`)}>
                Edit
              </button>
              <button
                className="btn btn-ghost text-xs text-chinar"
                onClick={() => { if (confirm('Delete this destination?')) onDelete(row.original.id); }}
              >
                Delete
              </button>
            </>
          )}
        </div>
      ),
    }),
  ];
}
