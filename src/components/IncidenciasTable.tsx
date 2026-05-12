import { useState } from 'react';
import { ExternalLink, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IncidenciaClasificada } from '../types';

interface Props {
  incidencias: IncidenciaClasificada[];
}

type SortKey = 'key' | 'status' | 'squad' | 'producto' | 'assignee' | 'edadDias' | 'createdDate';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export function IncidenciasTable({ incidencias }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('edadDias');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const sorted = [...incidencias].sort((a, b) => {
    const aVal = a[sortKey] ?? '';
    const bVal = b[sortKey] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal);
    const bStr = String(bVal);
    if (aStr < bStr) return sortDir === 'asc' ? -1 : 1;
    if (aStr > bStr) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <th
      className="px-3 py-2 font-medium text-slate-600 cursor-pointer hover:bg-slate-200 select-none"
      onClick={() => toggleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 text-slate-400" />
      </div>
    </th>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-100">
            <tr className="text-left">
              <SortHeader label="Clave" field="key" />
              <SortHeader label="Estado" field="status" />
              <SortHeader label="Squad" field="squad" />
              <SortHeader label="Producto" field="producto" />
              <SortHeader label="Asignado" field="assignee" />
              <SortHeader label="Edad (días)" field="edadDias" />
              <SortHeader label="Fecha Creación" field="createdDate" />
            </tr>
          </thead>
          <tbody>
            {paged.map(inc => (
              <tr key={inc.key} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2">
                  <a
                    href={inc.jiraUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {inc.key}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    ['Cerrado', 'Resuelto'].includes(inc.status)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {inc.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-600">{inc.squad}</td>
                <td className="px-3 py-2 text-slate-600">{inc.producto}</td>
                <td className="px-3 py-2 text-slate-600">{inc.assignee || '—'}</td>
                <td className="px-3 py-2 font-mono">{inc.edadDias}</td>
                <td className="px-3 py-2 text-slate-500">{new Date(inc.createdDate).toLocaleDateString('es-CO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <p className="text-sm text-slate-500">
            Mostrando {page * PAGE_SIZE + 1} a {Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length} incidencias
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm text-slate-600">
              Página {page + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1 rounded border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
