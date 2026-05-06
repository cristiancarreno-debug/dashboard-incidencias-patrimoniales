import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { ConcentracionPlataforma } from '../types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

interface Props {
  data: ConcentracionPlataforma[];
}

export function PlatformPie({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  // Ordenar de mayor a menor
  const sorted = [...data].sort((a, b) => b.cantidad - a.cantidad);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={sorted}
            dataKey="cantidad"
            nameKey="plataforma"
            cx="50%"
            cy="50%"
            outerRadius={110}
            label={false}
          >
            {sorted.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => {
            const item = sorted.find(d => d.plataforma === name);
            return [`${value} incidencias (${item?.porcentaje}%)`, name];
          }} />
        </PieChart>
      </ResponsiveContainer>

      {/* Leyenda ordenada de mayor a menor */}
      <div className="text-sm space-y-2 min-w-[200px]">
        {sorted.map((d, i) => (
          <div key={d.plataforma} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-slate-700 flex-1">{d.plataforma}</span>
            <span className="text-slate-500 font-mono text-xs">{d.porcentaje}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
