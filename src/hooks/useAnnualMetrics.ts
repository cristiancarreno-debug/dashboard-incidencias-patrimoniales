import { useMemo } from 'react';
import type { IncidenciaClasificada, MetricaAnual } from '../types';
import { esTerminal } from './useSummaryMetrics';

/**
 * Calcula métricas anuales (creadas, cerradas, % cierre, promedio días, más antigua).
 * Se recalcula solo cuando cambia el array de incidencias.
 * NO depende de fechaDesde/fechaHasta — siempre muestra todos los años.
 */
export function useAnnualMetrics(incidencias: IncidenciaClasificada[]): MetricaAnual[] {
  return useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    return years.map(anio => {
      const delAnio = incidencias.filter(i => new Date(i.createdDate).getFullYear() === anio);
      const cerradas = delAnio.filter(i => esTerminal(i.status));
      const abiertas = delAnio.filter(i => !esTerminal(i.status));

      const totalCreadas = delAnio.length;
      const totalCerradas = cerradas.length;
      const porcentajeCierre = totalCreadas > 0
        ? Math.round((totalCerradas / totalCreadas) * 10000) / 100
        : 0;

      const diasCerradas = cerradas.map(i => i.edadDias);
      const promedioDiasAtencion = diasCerradas.length > 0
        ? Math.round((diasCerradas.reduce((a, b) => a + b, 0) / diasCerradas.length) * 10) / 10
        : 0;

      const incidenciaMasAntigua = abiertas.length > 0
        ? Math.max(...abiertas.map(i => i.edadDias))
        : 0;

      return { anio, totalCreadas, totalCerradas, porcentajeCierre, promedioDiasAtencion, incidenciaMasAntigua };
    });
  }, [incidencias]);
}
