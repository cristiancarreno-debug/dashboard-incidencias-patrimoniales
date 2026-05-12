import type { MetricaAnual } from '../types';
import type { FiltrosIncidencias } from '../types';

interface Props {
  data: MetricaAnual[];
  filtros: FiltrosIncidencias;
}

export function AnnualTable({ data, filtros }: Props) {
  // Calcular días transcurridos en 2026 según filtro
  const calcularDias2026 = (): number => {
    const hoy = new Date();
    const fin2026 = filtros.fechaHasta
      ? new Date(filtros.fechaHasta)
      : hoy;

    const finReal = fin2026 < hoy ? fin2026 : hoy;
    const diffMs = finReal.getTime() - new Date('2026-01-01').getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  };

  const dias2026 = calcularDias2026();

  // Obtener datos por año
  const datos2024 = data.find(d => d.anio === 2024);
  const datos2025 = data.find(d => d.anio === 2025);

  // Calcular variación 2025 vs 2024
  const variacion2025vs2024 = datos2024 && datos2025 && datos2024.totalCreadas > 0
    ? Math.round(((datos2025.totalCreadas - datos2024.totalCreadas) / datos2024.totalCreadas) * 100)
    : null;

  // Calcular meta 2026: (incidentes2025 / 365) * dias2026 * 0.5
  const meta2026 = datos2025
    ? Math.round((datos2025.totalCreadas / 365) * dias2026 * 0.5)
    : null;

  return (
    <div className="overflow-x-auto">
      <table className="text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="px-3 py-2 font-medium text-slate-600">Año</th>
            <th className="px-3 py-2 font-medium text-slate-600">Creadas</th>
            <th className="px-3 py-2 font-medium text-slate-600">Cerradas</th>
            <th className="px-3 py-2 font-medium text-slate-600">% Cierre</th>
            <th className="px-3 py-2 font-medium text-slate-600">Prom. Días</th>
            <th className="px-3 py-2 font-medium text-slate-600">Más Antigua</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.anio} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2 font-semibold">{row.anio}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{row.totalCreadas}</span>
                  {/* Variación 2025 vs 2024 */}
                  {row.anio === 2025 && variacion2025vs2024 !== null && (() => {
                    // Lógica: se espera DISMINUCIÓN año a año
                    // variacion2025vs2024 es negativo si disminuyó, positivo si aumentó
                    // disminución = valor negativo (ej: -14% significa que bajó 14%)
                    const disminucion = -variacion2025vs2024; // positivo si bajó, negativo si subió
                    const color = disminucion >= 50 ? 'text-green-600' :
                                  disminucion >= 30 ? 'text-orange-500' :
                                  'text-red-600';
                    const flecha = variacion2025vs2024 > 0 ? '↑' : '↓';
                    return (
                      <span className={`text-sm font-bold ${color}`}>
                        {flecha} {Math.abs(variacion2025vs2024)}%
                      </span>
                    );
                  })()}
                  {/* Meta 2026 */}
                  {row.anio === 2026 && meta2026 !== null && (
                    <span className={`text-sm font-bold ${row.totalCreadas <= meta2026 ? 'text-green-600' : 'text-red-600'}`}>
                      Meta: {meta2026}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2 font-semibold">{row.totalCerradas}</td>
              <td className="px-3 py-2">
                <span className={row.porcentajeCierre >= 80 ? 'text-green-600 font-semibold' : row.porcentajeCierre >= 60 ? 'text-amber-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {row.porcentajeCierre.toFixed(0)}%
                </span>
              </td>
              <td className="px-3 py-2">{row.promedioDiasAtencion.toFixed(1)}</td>
              <td className="px-3 py-2">{row.incidenciaMasAntigua}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
