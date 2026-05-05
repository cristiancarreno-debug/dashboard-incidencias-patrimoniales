import type { IncidenciaClasificada } from '../types';
import { DEMO_INCIDENCIAS } from './demo-data';

interface JiraDataResponse {
  lastUpdated: string;
  totalRaw: number;
  incidencias: IncidenciaClasificada[];
}

let cachedData: { incidencias: IncidenciaClasificada[]; lastUpdated: string } | null = null;

/**
 * Carga los datos de incidencias.
 * Intenta cargar el JSON real generado por el script de Jira.
 * Si no existe (desarrollo local), usa datos demo.
 */
export async function loadIncidencias(): Promise<{ incidencias: IncidenciaClasificada[]; lastUpdated: string }> {
  if (cachedData) return cachedData;

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/incidencias.json`);
    if (response.ok) {
      const data: JiraDataResponse = await response.json();
      cachedData = { incidencias: data.incidencias, lastUpdated: data.lastUpdated };
      return cachedData;
    }
  } catch {
    // Fallback a datos demo
  }

  cachedData = { incidencias: DEMO_INCIDENCIAS, lastUpdated: new Date().toISOString() };
  return cachedData;
}
