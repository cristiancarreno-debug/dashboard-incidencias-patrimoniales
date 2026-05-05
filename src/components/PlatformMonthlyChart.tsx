import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useMemo } from 'react';
import type { IncidenciaClasificada } from '../types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

interface Props {
  incidencias: IncidenciaClasificada[];
}

export function PlatformMonthlyChart({ incidencias }: Props) {
  const { chartData, plataformas } = useMemo(() => {
    const mesPlataformaMap = new Map<string, Map<string, number>>();
    const plataformasSet = new Set<string>();

    incidencias.forEach(inc => {
      const mes = inc.createdDate.slice(0, 7);
      plataformasSet.add(inc.plataforma);
      if (!mesPlataformaMap.has(mes)) mesPlataformaMap.set(mes, new Map());
      const platMap = mesPlataformaMap.get(mes)!;
      platMap.set(inc.plataforma, (platMap.get(inc.plataforma) || 0) + 1);
    });

    const meses = Array.from(mesPlataformaMap.keys()).sort();
    const plataformas = Array.from(plataformasSet).sort();

    const chartData = meses.map(mes => {
      const entry: Record<string, string | number> = { mes };
      const platMap = mesPlataformaMap.get(mes)!;
      plataformas.forEach(p => { entry[p] = platMap.get(p) || 0; });
      return entry;
    });

    return { chartData, plataformas };
  }, [incidencias]);

  if (chartData.length === 0) {
    return <p className="text-slate-400 text-center py-8">Sin datos para mostrar</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
        <YAxis />
        <Tooltip />
        <Legend />
        {plataformas.map((plat, i) => (
          <Bar key={plat} dataKey={plat} stackId="a" fill={COLORS[i % COLORS.length]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
