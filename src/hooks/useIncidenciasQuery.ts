import { useQuery } from '@tanstack/react-query';
import { loadIncidencias } from '../data/load-data';
import type { IncidenciaClasificada } from '../types';

interface UseIncidenciasQueryReturn {
  /** Lista de incidencias cargadas */
  incidencias: IncidenciaClasificada[];
  /** Fecha de última actualización formateada en locale es-CO */
  lastUpdated: string;
  /** Indica si la carga inicial está en progreso */
  isLoading: boolean;
  /** Indica si ocurrió un error en la carga */
  isError: boolean;
  /** Función para forzar una recarga de datos */
  refetch: () => void;
}

const FIVE_MINUTES = 300_000;

/**
 * Hook que encapsula la carga de incidencias usando React Query.
 * Implementa polling cada 5 minutos, staleTime de 5 minutos y 2 reintentos.
 *
 * @returns Objeto con incidencias, estado de carga y función de refetch
 *
 * @example
 * ```tsx
 * const { incidencias, lastUpdated, isLoading, refetch } = useIncidenciasQuery();
 * ```
 */
export function useIncidenciasQuery(): UseIncidenciasQueryReturn {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['incidencias'],
    queryFn: loadIncidencias,
    staleTime: FIVE_MINUTES,
    refetchInterval: FIVE_MINUTES,
    retry: 2,
  });

  const incidencias = data?.incidencias ?? [];
  const lastUpdated = data?.lastUpdated
    ? new Date(data.lastUpdated).toLocaleString('es-CO')
    : 'Cargando...';

  return {
    incidencias,
    lastUpdated,
    isLoading,
    isError,
    refetch: () => { refetch(); },
  };
}
