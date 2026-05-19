import { useState, useMemo, useCallback } from 'react';
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

/** Definición de una columna para DataTable. */
export interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
}

/** Props del componente DataTable. */
export interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pageSize?: number;
  emptyMessage?: string;
}

type SortDir = 'asc' | 'desc';

const ALIGN_CLASSES: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Componente genérico de tabla con ordenamiento por columna y paginación.
 */
export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<(keyof T & string) | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);

  const toggleSort = useCallback(
    (key: keyof T & string) => {
      if (sortKey === key) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(0);
    },
    [sortKey],
  );

  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === 'asc' ? -1 : 1;
      if (bVal == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable !== false;
                const align = col.align ?? 'left';
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 font-medium text-slate-600',
                      ALIGN_CLASSES[align],
                      isSortable && 'cursor-pointer select-none hover:bg-slate-200',
                    )}
                    onClick={isSortable ? () => toggleSort(col.key) : undefined}
                  >
                    <div className={cn('flex items-center gap-1', align === 'center' && 'justify-center', align === 'right' && 'justify-end')}>
                      {col.label}
                      {isSortable && (
                        <ArrowUpDown className={cn('h-3 w-3', sortKey === col.key ? 'text-slate-800' : 'text-slate-400')} />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, rowIdx) => (
              <tr key={rowIdx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                {columns.map((col) => {
                  const align = col.align ?? 'left';
                  const value = row[col.key];
                  return (
                    <td key={col.key} className={cn('px-4 py-3 text-slate-700', ALIGN_CLASSES[align])}>
                      {col.render ? col.render(value, row) : String(value ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <p className="text-sm text-slate-500">
            Mostrando {page * pageSize + 1} a {Math.min((page + 1) * pageSize, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-600">{page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
