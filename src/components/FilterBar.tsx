import { useState, useRef, useEffect } from 'react';
import type { FiltrosIncidencias } from '../types';
import { X, ChevronDown, CheckSquare, Square } from 'lucide-react';

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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const selectAll = () => onChange([...options]);
  const deselectAll = () => onChange([]);

  return (
    <div className="relative" ref={ref}>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm bg-white text-left flex items-center gap-1 hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <span className="flex-1 truncate text-slate-700">
          {selected.length === 0 ? 'Todos' : selected.length === options.length ? 'Todos' : `${selected.length} de ${options.length}`}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 overflow-y-auto min-w-[200px]">
          {/* Acciones rápidas */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white">
            <button
              onClick={selectAll}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <CheckSquare className="h-3 w-3" /> Todos
            </button>
            <button
              onClick={deselectAll}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <Square className="h-3 w-3" /> Ninguno
            </button>
          </div>
          {/* Opciones */}
          {options.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-400">Sin opciones</p>
          ) : (
            options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm border-b border-slate-50 last:border-0">
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="truncate text-slate-700">{opt}</span>
              </label>
            ))
          )}
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
    <div className="bg-white rounded-lg shadow p-4 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end w-full">
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

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Desde</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={filtros.fechaDesde?.slice(0, 10) || ''}
            onChange={e => onFechaDesdeChange(e.target.value || undefined)}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Hasta</label>
          <input
            type="date"
            className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            value={filtros.fechaHasta?.slice(0, 10) || ''}
            onChange={e => onFechaHastaChange(e.target.value || undefined)}
          />
        </div>

        <div className="flex items-end h-full">
          {hasFilters ? (
            <button
              onClick={onLimpiar}
              className="w-full flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors font-medium"
            >
              <X className="h-4 w-4" /> Limpiar
            </button>
          ) : (
            <div className="w-full py-2 text-center text-xs text-slate-400">Sin filtros</div>
          )}
        </div>
      </div>
    </div>
  );
}
