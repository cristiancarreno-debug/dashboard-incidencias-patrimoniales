import type { IncidenciaClasificada } from '../types';
import { DEMO_INCIDENCIAS } from './demo-data';

interface JiraDataResponse {
  lastUpdated: string;
  totalRaw: number;
  incidencias: IncidenciaClasificada[];
}

/**
 * Carga los datos de incidencias.
 * Intenta cargar el JSON real generado por el script de Jira.
 * Si no existe (desarrollo local), usa datos demo.
 * El caching es gestionado por React Query — esta función siempre hace fetch.
 */
export async function loadIncidencias(): Promise<{ incidencias: IncidenciaClasificada[]; lastUpdated: string }> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/incidencias.json`);
    if (response.ok) {
      const data: JiraDataResponse = await response.json();
      return { incidencias: data.incidencias, lastUpdated: data.lastUpdated };
    }
  } catch {
    // Fallback a datos demo
  }

  return { incidencias: DEMO_INCIDENCIAS, lastUpdated: new Date().toISOString() };
}
