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
import { Input } from '@/components/FormControls';
import { roadStatus, type RoadStatus } from '@/lib/api';

const STATUS_COLOR: Record<string, string> = {
  open: 'pill-success',
  'one-way': 'pill-warning',
  closed: 'pill-danger',
  restricted: 'pill-info',
};

export default function RoadStatusPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useQuery({ queryKey: ['road-status'], queryFn: roadStatus.list });
  const del = useMutation({
    mutationFn: (id: string) => roadStatus.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['road-status'] }),
  });

  const columns = useMemo(() => buildColumns(router, del.mutate), [router, del.mutate]);
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
        title="Road Status"
        subtitle={`${data?.length ?? 0} monitored roads`}
        action={<button className="btn btn-primary" onClick={() => router.push('/road-status/new')}>+ New road</button>}
      />
      <div className="p-8 space-y-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search roads…" className="max-w-md" />
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
                <tr><td colSpan={5} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>
              )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={5} className="p-12 text-center font-quote italic text-xl text-ink-2">No road status entries match.</td></tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/road-status/${row.original.id}`)}
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

const ch = createColumnHelper<RoadStatus>();

function buildColumns(router: ReturnType<typeof useRouter>, onDelete: (id: string) => void) {
  return [
    ch.accessor('name', {
      header: 'Name',
      cell: (i) => (
        <div>
          <div className="font-semibold">{i.getValue()}</div>
          <div className="font-mono text-[10px] text-ink-3 mt-0.5 tracking-wide">{i.row.original.slug}</div>
        </div>
      ),
    }),
    ch.accessor('status', {
      header: 'Status',
      cell: (i) => (
        <span className={`pill ${STATUS_COLOR[i.getValue()] ?? 'pill-neutral'}`}>
          {i.getValue().toUpperCase().replace('-', ' ')}
        </span>
      ),
    }),
    ch.accessor('closure_reason', {
      header: 'Reason',
      cell: (i) => <span className="text-xs text-ink-2">{i.getValue() ?? '—'}</span>,
    }),
    ch.accessor('last_checked', {
      header: 'Last checked',
      cell: (i) => <span className="font-mono text-xs text-ink-3">{new Date(i.getValue()).toLocaleDateString('en-IN')}</span>,
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/road-status/view/${row.original.id}`)}>View</button>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/road-status/${row.original.id}`)}>Edit</button>
          <button
            className="btn btn-ghost text-xs text-chinar"
            onClick={() => { if (confirm(`Delete "${row.original.name}"?`)) onDelete(row.original.id); }}
          >
            Delete
          </button>
        </div>
      ),
    }),
  ];
}
