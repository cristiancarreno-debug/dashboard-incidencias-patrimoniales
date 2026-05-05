import { useState } from 'react';
import type { FiltrosIncidencias } from '../types';
import { X, ChevronDown } from 'lucide-react';

interface Props {
  filtros: FiltrosIncidencias;
  tribus: string[];
  squadsDisponibles: string[];
  productosDisponibles: string[];
  plataformasDisponibles: string[];
  onTribusChange: (v: string[]) => void;
  onSquadsChange: (v: string[]) => void;
  onProductosChange: (v: string[]) => void;
  onPlataformasChange: (v: string[]) => void;
  onFechaDesdeChange: (v?: string) => void;
  onFechaHastaChange: (v?: string) => void;
  onLimpiar: () => void;
}

function MultiSelect({ label, options, selected, onChange }: {
  label: string; options: string[]; selected: string[]; onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div className="relative flex flex-col">
      <label className="text-xs font-medium text-slate-500 mb-1">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white text-left flex items-center gap-1 min-w-[140px]"
      >
        <span className="flex-1 truncate">
          {selected.length === 0 ? 'Todos' : `${selected.length} seleccionado${selected.length > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-48 overflow-y-auto min-w-[180px]">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="rounded border-slate-300"
              />
              <span className="truncate">{opt}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function FilterBar({
  filtros, tribus, squadsDisponibles, productosDisponibles,
  plataformasDisponibles, onTribusChange, onSquadsChange,
  onProductosChange, onPlataformasChange, onFechaDesdeChange,
  onFechaHastaChange, onLimpiar,
}: Props) {
  const hasFilters = Object.values(filtros).some(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true));

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-wrap gap-3 items-end">
        <MultiSelect
          label="Tribu"
          options={tribus}
          selected={filtros.tribus || []}
          onChange={onTribusChange}
        />
        <MultiSelect
          label="Squad"
          options={squadsDisponibles}
          selected={filtros.squads || []}
          onChange={onSquadsChange}
        />
        <MultiSelect
          label="Producto"
          options={productosDisponibles}
          selected={filtros.productos || []}
          onChange={onProductosChange}
        />
        <MultiSelect
          label="Plataforma"
          options={plataformasDisponibles}
          selected={filtros.plataformas || []}
          onChange={onPlataformasChange}
        />

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Desde</label>
          <input
            type="date"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            value={filtros.fechaDesde?.slice(0, 10) || ''}
            onChange={e => onFechaDesdeChange(e.target.value || undefined)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500 mb-1">Hasta</label>
          <input
            type="date"
            className="border border-slate-300 rounded px-3 py-1.5 text-sm"
            value={filtros.fechaHasta?.slice(0, 10) || ''}
            onChange={e => onFechaHastaChange(e.target.value || undefined)}
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
