import type { MetricaAnual } from '../types';

interface Props {
  data: MetricaAnual[];
}

export function AnnualTable({ data }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-100 text-left">
            <th className="px-4 py-2 font-medium text-slate-600">Año</th>
            <th className="px-4 py-2 font-medium text-slate-600">Creadas</th>
            <th className="px-4 py-2 font-medium text-slate-600">Cerradas</th>
            <th className="px-4 py-2 font-medium text-slate-600">% Cierre</th>
            <th className="px-4 py-2 font-medium text-slate-600">Prom. Días Atención</th>
            <th className="px-4 py-2 font-medium text-slate-600">Más Antigua (días)</th>
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.anio} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-2 font-semibold">{row.anio}</td>
              <td className="px-4 py-2">{row.totalCreadas}</td>
              <td className="px-4 py-2">{row.totalCerradas}</td>
              <td className="px-4 py-2">
                <span className={row.porcentajeCierre >= 80 ? 'text-green-600' : row.porcentajeCierre >= 60 ? 'text-amber-600' : 'text-red-600'}>
                  {row.porcentajeCierre.toFixed(2)}%
                </span>
              </td>
              <td className="px-4 py-2">{row.promedioDiasAtencion.toFixed(1)}</td>
              <td className="px-4 py-2">{row.incidenciaMasAntigua}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
