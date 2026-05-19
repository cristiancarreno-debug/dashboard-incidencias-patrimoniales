import { useMemo } from 'react';
import type { IncidenciaClasificada, DistribucionRango, RangoResolucion } from '../types';

const RANGOS: RangoResolucion[] = [
  'Mismo día', '1-2 días', '3-7 días', '1-2 semanas', '2-4 semanas', 'Más de 4 semanas',
];

/**
 * Calcula distribución de tiempos de resolución.
 * Se recalcula solo cuando cambia el array de incidencias.
 * NO depende de fechaDesde/fechaHasta.
 */
export function useResolutionMetrics(incidencias: IncidenciaClasificada[]): DistribucionRango[] {
  return useMemo(() => {
    const cerradas = incidencias.filter(i => i.rangoResolucion !== null);
    const map = new Map<RangoResolucion, number>();
    RANGOS.forEach(r => map.set(r, 0));
    cerradas.forEach(i => map.set(i.rangoResolucion!, (map.get(i.rangoResolucion!) || 0) + 1));
    const total = cerradas.length || 1;
    return RANGOS.map(rango => ({
      rango,
      cantidad: map.get(rango) || 0,
      porcentaje: Math.round(((map.get(rango) || 0) / total) * 10000) / 100,
    }));
  }, [incidencias]);
}
