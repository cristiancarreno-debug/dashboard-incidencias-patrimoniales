import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { MetricaMensual } from '../types';

interface Props {
  data: MetricaMensual[];
}

interface TrimestrePromedio {
  label: string;
  promedio: number;
  meses: string[];
}

function calcularPromediosTrimestrales(data: MetricaMensual[]): TrimestrePromedio[] {
  if (data.length === 0) return [];

  const trimestres: TrimestrePromedio[] = [];
  const mesesPorTrimestre: Record<string, MetricaMensual[]> = {};

  data.forEach(d => {
    const [year, month] = d.mes.split('-');
    const q = Math.ceil(parseInt(month) / 3);
    const key = `${year} ${q === 1 ? 'I' : q === 2 ? 'II' : q === 3 ? 'III' : 'IV'} trimestre`;
    if (!mesesPorTrimestre[key]) mesesPorTrimestre[key] = [];
    mesesPorTrimestre[key].push(d);
  });

  Object.entries(mesesPorTrimestre).forEach(([label, meses]) => {
    const totalCreadas = meses.reduce((sum, m) => sum + m.abiertas, 0);
    const promedio = Math.round(totalCreadas / meses.length);
    trimestres.push({ label: `Promedio creadas ${label}`, promedio, meses: meses.map(m => m.mes) });
  });

  return trimestres;
}

export function MonthlyChart({ data }: Props) {
  if (data.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  const trimestres = calcularPromediosTrimestrales(data);

  return (
    <div>
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
          <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }} />
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

      {/* Promedios trimestrales */}
      {trimestres.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {trimestres.map((t) => (
            <div key={t.label} className="border-2 border-dashed border-red-400 rounded px-3 py-2 text-center">
              <div className="text-lg font-bold text-red-600">{t.promedio}</div>
              <div className="text-xs text-red-500 italic">{t.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
