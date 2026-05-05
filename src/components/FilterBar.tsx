import type { FiltrosIncidencias, Tribu, Squad, Producto } from '../types';
import { X } from 'lucide-react';

interface Props {
  filtros: FiltrosIncidencias;
  tribus: string[];
  squadsDisponibles: string[];
  productosDisponibles: string[];
  plataformasDisponibles: string[];
  onTribuChange: (v?: Tribu) => void;
  onSquadChange: (v?: Squad) => void;
  onProductoChange: (v?: Producto) => void;
  onPlataformaChange: (v?: string) => void;
  onFechaDesdeChange: (v?: string) => void;
  onFechaHastaChange: (v?: string) => void;
  onLimpiar: () => void;
}

export function FilterBar({
  filtros, tribus, squadsDisponibles, productosDisponibles,
  plataformasDisponibles, onTribuChange, onSquadChange,
  onProductoChange, onPlataformaChange, onFechaDesdeChange,
  onFechaHastaChange, onLimpiar,
}: Props) {
  const hasFilters = Object.values(filtros).some(v => v !== undefined);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Tribu</label>
          <select
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
            value={filtros.tribu || ''}
            onChange={e => onTribuChange(e.target.value as Tribu || undefined)}
          >
            <option value="">Todas</option>
            {tribus.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Squad</label>
          <select
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
            value={filtros.squad || ''}
            onChange={e => onSquadChange(e.target.value as Squad || undefined)}
          >
            <option value="">Todos</option>
            {squadsDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Producto</label>
          <select
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
            value={filtros.producto || ''}
            onChange={e => onProductoChange(e.target.value as Producto || undefined)}
          >
            <option value="">Todos</option>
            {productosDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Plataforma</label>
          <select
            className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white"
            value={filtros.plataforma || ''}
            onChange={e => onPlataformaChange(e.target.value || undefined)}
          >
            <option value="">Todas</option>
            {plataformasDisponibles.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Desde</label>
          <input
            type="date"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            value={filtros.fechaDesde?.slice(0, 10) || ''}
            onChange={e => onFechaDesdeChange(e.target.value ? e.target.value + 'T00:00:00.000Z' : undefined)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Hasta</label>
          <input
            type="date"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            value={filtros.fechaHasta?.slice(0, 10) || ''}
            onChange={e => onFechaHastaChange(e.target.value ? e.target.value + 'T23:59:59.999Z' : undefined)}
          />
        </div>

        {hasFilters && (
          <button
            onClick={onLimpiar}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 transition-colors"
          >
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
