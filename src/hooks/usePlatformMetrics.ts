import { useMemo } from 'react';
import type { IncidenciaClasificada, ConcentracionPlataforma } from '../types';

/**
 * Calcula concentración de incidencias por plataforma.
 * Se recalcula solo cuando cambia el array de incidencias.
 * NO depende de fechaDesde/fechaHasta.
 */
export function usePlatformMetrics(incidencias: IncidenciaClasificada[]): ConcentracionPlataforma[] {
  return useMemo(() => {
    const map = new Map<string, number>();
    incidencias.forEach(i => map.set(i.plataforma, (map.get(i.plataforma) || 0) + 1));
    const total = incidencias.length || 1;
    return Array.from(map.entries())
      .map(([plataforma, cantidad]) => ({
        plataforma,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 10000) / 100,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [incidencias]);
}
