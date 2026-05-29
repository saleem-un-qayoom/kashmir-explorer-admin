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
import { categories, type Category } from '@/lib/api';

export default function CategoriesPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: categories.list });
  const del = useMutation({
    mutationFn: (id: string) => categories.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
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
        title="Categories"
        subtitle={`${data?.length ?? 0} categories`}
        action={<button className="btn btn-primary" onClick={() => router.push('/categories/new')}>+ New category</button>}
      />
      <div className="p-8 space-y-4">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" className="max-w-md" />
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
                <tr><td colSpan={6} className="p-8 text-center font-quote italic text-ink-2">Loading…</td></tr>
              )}
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <tr><td colSpan={6} className="p-12 text-center font-quote italic text-xl text-ink-2">No categories match.</td></tr>
              )}
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => router.push(`/categories/${row.original.id}`)}
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

const ch = createColumnHelper<Category>();

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
    ch.accessor('icon', {
      header: 'Icon',
      cell: (i) => i.getValue() ?? '—',
    }),
    ch.accessor('color', {
      header: 'Color',
      cell: (i) =>
        i.getValue() ? (
          <div className="flex items-center gap-2">
            <span className="inline-block w-5 h-5 rounded-card" style={{ backgroundColor: i.getValue() }} />
            <span className="font-mono text-[10px] text-ink-3">{i.getValue()}</span>
          </div>
        ) : '—',
    }),
    ch.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/categories/view/${row.original.id}`)}>View</button>
          <button className="btn btn-ghost text-xs" onClick={() => router.push(`/categories/${row.original.id}`)}>Edit</button>
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
