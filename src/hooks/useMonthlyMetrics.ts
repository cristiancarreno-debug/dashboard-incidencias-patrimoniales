import { useMemo } from 'react';
import type { IncidenciaClasificada, MetricaMensual } from '../types';

/**
 * Calcula métricas mensuales (creadas, cerradas, backlog acumulado).
 * Se recalcula solo cuando cambian las incidencias o el rango de fechas.
 */
export function useMonthlyMetrics(
  incidencias: IncidenciaClasificada[],
  fechaDesde?: string,
  fechaHasta?: string,
): MetricaMensual[] {
  return useMemo(() => {
    if (incidencias.length === 0) return [];

    const mesesMap = new Map<string, { abiertas: number; cerradas: number }>();

    let minMes: string;
    let maxMes: string;

    if (fechaDesde) {
      minMes = fechaDesde.slice(0, 7);
    } else {
      const fechas = incidencias.map(i => i.createdDate.slice(0, 7));
      minMes = fechas.reduce((a, b) => a < b ? a : b);
    }

    if (fechaHasta) {
      maxMes = fechaHasta.slice(0, 7);
    } else {
      const fechas = incidencias.map(i => i.createdDate.slice(0, 7));
      maxMes = fechas.reduce((a, b) => a > b ? a : b);
    }

    const [startY, startM] = minMes.split('-').map(Number);
    const [endY, endM] = maxMes.split('-').map(Number);
    let y = startY, m = startM;
    while (y < endY || (y === endY && m <= endM)) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      mesesMap.set(key, { abiertas: 0, cerradas: 0 });
      m++;
      if (m > 12) { m = 1; y++; }
    }

    incidencias.forEach(inc => {
      const mesCreacion = inc.createdDate.slice(0, 7);
      if (mesesMap.has(mesCreacion)) {
        mesesMap.get(mesCreacion)!.abiertas++;
      }
      if (inc.resolvedDate) {
        const mesCierre = inc.resolvedDate.slice(0, 7);
        if (mesesMap.has(mesCierre)) {
          mesesMap.get(mesCierre)!.cerradas++;
        }
      }
    });

    const mesesOrdenados = Array.from(mesesMap.keys()).sort();
    let acumulado = 0;

    return mesesOrdenados.map(mes => {
      const data = mesesMap.get(mes)!;
      acumulado += data.abiertas - data.cerradas;
      return { mes, abiertas: data.abiertas, cerradas: data.cerradas, pendientes: Math.max(0, acumulado) };
    });
  }, [incidencias, fechaDesde, fechaHasta]);
}
