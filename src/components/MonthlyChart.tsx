import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { MetricaMensual } from '../types';

interface Props {
  data: MetricaMensual[];
}

interface TrimestrePromedio {
  label: string;
  promedio: number;
  spanMeses: number; // cuántos meses abarca este trimestre en los datos
}

function calcularPromediosTrimestrales(data: MetricaMensual[]): TrimestrePromedio[] {
  if (data.length === 0) return [];

  const trimestres: { key: string; label: string; meses: MetricaMensual[] }[] = [];
  let currentKey = '';

  data.forEach(d => {
    const [year, month] = d.mes.split('-');
    const q = Math.ceil(parseInt(month) / 3);
    const romanQ = q === 1 ? 'I' : q === 2 ? 'II' : q === 3 ? 'III' : 'IV';
    const key = `${year}-Q${q}`;
    const label = `Promedio creadas ${year} ${romanQ} trimestre`;

    if (key !== currentKey) {
      trimestres.push({ key, label, meses: [d] });
      currentKey = key;
    } else {
      trimestres[trimestres.length - 1].meses.push(d);
    }
  });

  // Solo incluir trimestres completos (3 meses)
  return trimestres
    .filter(t => t.meses.length === 3)
    .map(t => {
      const totalCreadas = t.meses.reduce((sum, m) => sum + m.abiertas, 0);
      const promedio = Math.round(totalCreadas / t.meses.length);
      return { label: t.label, promedio, spanMeses: t.meses.length };
    });
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

      {/* Promedios trimestrales alineados con las barras */}
      {trimestres.length > 0 && (
        <div className="flex -mt-4 mx-[50px] mr-[30px]">
          {trimestres.map((t) => (
            <div
              key={t.label}
              className="border-2 border-dashed border-red-400 rounded py-2 px-1 text-center"
              style={{ flex: `${t.spanMeses} ${t.spanMeses} 0%` }}
            >
              <div className="text-xl font-bold text-slate-800">{t.promedio}</div>
              <div className="text-[10px] text-red-500 italic leading-tight">{t.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
