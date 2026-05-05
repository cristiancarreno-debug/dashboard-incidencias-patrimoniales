import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import type { MetricaMensual } from '../types';

interface Props {
  data: MetricaMensual[];
}

export function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="abiertas" name="Abiertas en el mes" fill="#3b82f6" />
        <Bar dataKey="cerradas" name="Cerradas en el mes" fill="#22c55e" />
        <Line type="monotone" dataKey="pendientes" name="Pendientes acumuladas" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
