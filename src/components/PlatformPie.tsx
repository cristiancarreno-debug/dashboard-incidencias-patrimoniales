import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ConcentracionPlataforma } from '../types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

interface Props {
  data: ConcentracionPlataforma[];
}

export function PlatformPie({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="plataforma"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={({ plataforma, porcentaje }) => `${plataforma}: ${porcentaje}%`}
          labelLine={false}
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} incidencias`, name]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
