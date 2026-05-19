import type { IncidenciaClasificada } from '../types';
import { useSummaryMetrics } from './useSummaryMetrics';
import { useMonthlyMetrics } from './useMonthlyMetrics';
import { useAnnualMetrics } from './useAnnualMetrics';
import { usePlatformMetrics } from './usePlatformMetrics';
import { useResolutionMetrics } from './useResolutionMetrics';

/**
 * Hook compuesto que orquesta todos los cálculos de métricas.
 *
 * Cada sub-hook tiene sus propias dependencias de memoización:
 * - useSummaryMetrics: solo recalcula con [incidencias]
 * - useMonthlyMetrics: recalcula con [incidencias, fechaDesde, fechaHasta]
 * - useAnnualMetrics: solo recalcula con [incidencias]
 * - usePlatformMetrics: solo recalcula con [incidencias]
 * - useResolutionMetrics: solo recalcula con [incidencias]
 *
 * Esto evita recalcular métricas anuales/plataforma/resolución
 * cuando solo cambia el rango de fechas (que solo afecta al gráfico mensual).
 */
export function useMetrics(incidencias: IncidenciaClasificada[], fechaDesde?: string, fechaHasta?: string) {
  const { totalGeneradas, totalResueltas, totalAbiertas } = useSummaryMetrics(incidencias);
  const metricasMensuales = useMonthlyMetrics(incidencias, fechaDesde, fechaHasta);
  const metricasAnuales = useAnnualMetrics(incidencias);
  const concentracionPlataforma = usePlatformMetrics(incidencias);
  const distribucionRangos = useResolutionMetrics(incidencias);

  return {
    totalGeneradas,
    totalResueltas,
    totalAbiertas,
    metricasMensuales,
    metricasAnuales,
    concentracionPlataforma,
    distribucionRangos,
  };
}
