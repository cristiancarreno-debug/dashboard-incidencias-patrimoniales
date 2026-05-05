import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { MetricaMensual } from '../types';

interface Props {
  data: MetricaMensual[];
}

export function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis />
        <Tooltip />
        <Legend
          verticalAlign="top"
          wrapperStyle={{ paddingBottom: 10 }}
        />
        <Bar dataKey="abiertas" name="CREADAS" stackId="stack" fill="#dc2626">
          <LabelList dataKey="abiertas" position="inside" fill="#fff" fontSize={9} />
        </Bar>
        <Bar dataKey="cerradas" name="CERRADAS" stackId="stack" fill="#16a34a">
          <LabelList dataKey="cerradas" position="inside" fill="#fff" fontSize={9} />
        </Bar>
        <Bar dataKey="pendientes" name="BACKLOG" stackId="stack" fill="#eab308">
          <LabelList dataKey="pendientes" position="inside" fill="#000" fontSize={9} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
