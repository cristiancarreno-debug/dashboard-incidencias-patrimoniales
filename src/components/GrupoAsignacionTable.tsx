import { useMemo } from 'react';
import type { IncidenciaClasificada } from '../types';

interface Props {
  incidencias: IncidenciaClasificada[];
}

export function GrupoAsignacionTable({ incidencias }: Props) {
  const grupos = useMemo(() => {
    const abiertas = incidencias.filter(i => !['Cerrado', 'Resuelto', 'Cancelado'].some(s => i.status.toLowerCase().includes(s.toLowerCase())));
    const map = new Map<string, number>();
    abiertas.forEach(i => {
      const grupo = (i as any).grupoAsignacion || 'Sin asignar';
      map.set(grupo, (map.get(grupo) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([grupo, cantidad]) => ({ grupo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [incidencias]);

  const total = grupos.reduce((sum, g) => sum + g.cantidad, 0);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-2">Abiertos por Grupo Asignación</h3>
      <table className="text-sm w-full">
        <tbody>
          {grupos.map((g, i) => (
            <tr key={g.grupo} className="border-b border-slate-100">
              <td className="py-1.5 text-slate-500 w-6">{i + 1}</td>
              <td className="py-1.5 text-slate-700">{g.grupo}</td>
              <td className="py-1.5 text-blue-800 text-right font-bold">{g.cantidad}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300">
            <td colSpan={2} className="py-2 font-bold text-blue-700">Total (Issues)</td>
            <td className="py-2 text-blue-800 text-right font-bold">{total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
