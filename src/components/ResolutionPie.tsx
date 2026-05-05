import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DistribucionRango } from '../types';

const COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444', '#7c3aed'];

interface Props {
  data: DistribucionRango[];
}

export function ResolutionPie({ data }: Props) {
  const dataConValores = data.filter(d => d.cantidad > 0);

  if (dataConValores.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos de resolución</p>;
  }

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={dataConValores}
            dataKey="cantidad"
            nameKey="rango"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ porcentaje }) => `${porcentaje}%`}
          >
            {dataConValores.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [`${value} incidencias (${data.find(d => d.rango === name)?.porcentaje}%)`, name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>

      <div className="text-sm space-y-1">
        {data.map((d, i) => (
          <div key={d.rango} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
            <span className="text-slate-600">{d.rango}: <strong>{d.cantidad}</strong> ({d.porcentaje}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
