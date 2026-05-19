import { useMemo } from 'react';
import type { IncidenciaClasificada } from '../types';

const ESTADOS_TERMINALES = ['Cerrado', 'Resuelto', 'Cancelado'];

function esTerminal(status: string): boolean {
  return ESTADOS_TERMINALES.some(t => status.toLowerCase().includes(t.toLowerCase()));
}

export { esTerminal };

interface SummaryMetrics {
  totalGeneradas: number;
  totalResueltas: number;
  totalAbiertas: number;
}

/**
 * Calcula contadores resumen: generadas, resueltas y abiertas.
 * Se recalcula solo cuando cambia el array de incidencias filtradas.
 */
export function useSummaryMetrics(incidencias: IncidenciaClasificada[]): SummaryMetrics {
  return useMemo(() => {
    const totalGeneradas = incidencias.length;
    const totalResueltas = incidencias.filter(i => esTerminal(i.status)).length;
    const totalAbiertas = totalGeneradas - totalResueltas;
    return { totalGeneradas, totalResueltas, totalAbiertas };
  }, [incidencias]);
}
