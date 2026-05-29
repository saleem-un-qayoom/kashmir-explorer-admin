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
import { regions, type Region } from '@/lib/api';

export default function RegionsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useQuery({ queryKey: ['regions'], queryFn: regions.list });
  const del = useMutation({
    mutationFn: (id: string) => regions.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['regions'] }),
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
        title="Regions"
        subtitle={`${data?.length ?? 0} regions`}
        action={<button className="btn btn-primary" onClick={() => router.push('/regions/new')}>+ New region</button>}
      />
      <div className="p-8 space-y-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search regions…" className="max-w-md" />
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
                <tr><td colSpan={4} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>
              )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={4} className="p-12 text-center font-quote italic text-xl text-ink-2">No regions match.</td></tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/regions/${row.original.id}`)}
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

const ch = createColumnHelper<Region>();

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
    ch.accessor('description', {
      header: 'Description',
      cell: (i) => <span className="text-ink-2 text-xs">{i.getValue() ?? '—'}</span>,
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/regions/view/${row.original.id}`)}>View</button>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/regions/${row.original.id}`)}>Edit</button>
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
