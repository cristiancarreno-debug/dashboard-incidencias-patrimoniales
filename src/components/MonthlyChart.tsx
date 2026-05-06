import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { MetricaMensual } from '../types';

interface Props {
  data: MetricaMensual[];
}

interface TrimestrePromedio {
  label: string;
  promedio: number;
  spanMeses: number;
  startIdx: number;
}

function calcularPromediosTrimestrales(data: MetricaMensual[]): TrimestrePromedio[] {
  if (data.length === 0) return [];

  // Agrupar meses por trimestre manteniendo el índice de posición
  const trimestreGroups: { key: string; label: string; startIdx: number; meses: MetricaMensual[] }[] = [];
  let currentKey = '';

  data.forEach((d, idx) => {
    const [year, month] = d.mes.split('-');
    const q = Math.ceil(parseInt(month) / 3);
    const romanQ = q === 1 ? 'I' : q === 2 ? 'II' : q === 3 ? 'III' : 'IV';
    const key = `${year}-Q${q}`;
    const label = `Promedio creadas ${year} ${romanQ} trimestre`;

    if (key !== currentKey) {
      trimestreGroups.push({ key, label, startIdx: idx, meses: [d] });
      currentKey = key;
    } else {
      trimestreGroups[trimestreGroups.length - 1].meses.push(d);
    }
  });

  // Solo trimestres completos (3 meses)
  return trimestreGroups
    .filter(t => t.meses.length === 3)
    .map(t => {
      const totalCreadas = t.meses.reduce((sum, m) => sum + m.abiertas, 0);
      const promedio = Math.round(totalCreadas / 3);
      return { label: t.label, promedio, spanMeses: 3, startIdx: t.startIdx };
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
        <div className="relative mx-[50px] mr-[30px]" style={{ marginTop: '-12px' }}>
          <div className="relative" style={{ height: '60px' }}>
            {trimestres.map((t) => {
              const totalMeses = data.length;
              const leftPct = (t.startIdx / totalMeses) * 100;
              const widthPct = (t.spanMeses / totalMeses) * 100;
              return (
                <div
                  key={t.label}
                  className="absolute border-2 border-dashed border-red-400 rounded py-1 px-1 text-center"
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  <div className="text-lg font-bold text-slate-800">{t.promedio}</div>
                  <div className="text-[9px] text-red-500 italic leading-tight truncate">{t.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
