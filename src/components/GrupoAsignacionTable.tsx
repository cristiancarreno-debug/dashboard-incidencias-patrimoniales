import { useMemo } from 'react';
import type { IncidenciaClasificada } from '../types';

interface Props {
  incidencias: IncidenciaClasificada[];
}

export function GrupoAsignacionTable({ incidencias }: Props) {
  const datos = useMemo(() => {
    const abiertas = incidencias.filter(i => !['Cerrado', 'Resuelto', 'Cancelado'].some(s => i.status.toLowerCase().includes(s.toLowerCase())));
    const creadas2026 = incidencias.filter(i => new Date(i.createdDate).getFullYear() === 2026);

    const gruposSet = new Set<string>();
    abiertas.forEach(i => gruposSet.add(i.grupoAsignacion || 'Sin asignar'));
    creadas2026.forEach(i => gruposSet.add(i.grupoAsignacion || 'Sin asignar'));

    const mapAbiertos = new Map<string, number>();
    abiertas.forEach(i => {
      const g = i.grupoAsignacion || 'Sin asignar';
      mapAbiertos.set(g, (mapAbiertos.get(g) || 0) + 1);
    });

    const mapCreados2026 = new Map<string, number>();
    creadas2026.forEach(i => {
      const g = i.grupoAsignacion || 'Sin asignar';
      mapCreados2026.set(g, (mapCreados2026.get(g) || 0) + 1);
    });

    const grupos = Array.from(gruposSet).map(grupo => ({
      grupo,
      abiertos: mapAbiertos.get(grupo) || 0,
      creados2026: mapCreados2026.get(grupo) || 0,
    })).sort((a, b) => b.abiertos - a.abiertos);

    const totalAbiertos = abiertas.length;
    const totalCreados2026 = creadas2026.length;

    return { grupos, totalAbiertos, totalCreados2026 };
  }, [incidencias]);

  return (
    <div>
      <h3 className="text-base font-semibold text-slate-700 mb-3">Clasificación por Grupo de Asignación</h3>
      <table className="text-sm w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="py-2 text-left text-slate-500 font-medium w-6">#</th>
            <th className="py-2 text-left text-slate-500 font-medium">Grupo</th>
            <th className="py-2 text-right text-slate-500 font-medium">Abiertos</th>
            <th className="py-2 text-right text-slate-500 font-medium">Creados 2026</th>
          </tr>
        </thead>
        <tbody>
          {datos.grupos.map((g, i) => (
            <tr key={g.grupo} className="border-b border-slate-100">
              <td className="py-2 text-slate-400">{i + 1}</td>
              <td className="py-2 text-slate-700">{g.grupo}</td>
              <td className="py-2 text-blue-700 text-right font-bold">{g.abiertos}</td>
              <td className="py-2 text-orange-600 text-right font-bold">{g.creados2026}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300">
            <td colSpan={2} className="py-2 font-bold text-blue-700">Total (Issues)</td>
            <td className="py-2 text-blue-700 text-right font-bold">{datos.totalAbiertos}</td>
            <td className="py-2 text-orange-600 text-right font-bold">{datos.totalCreados2026}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
