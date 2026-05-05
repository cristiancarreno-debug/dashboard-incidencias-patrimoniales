import type { IncidenciaClasificada, RangoResolucion } from '../types';
import { PRODUCTOS, PLATAFORMAS, PRODUCTO_TRIBU_MAP, PRODUCTO_SQUAD_MAP } from './mappings';

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function calcularEdad(created: Date, resolved: Date | null): number {
  const end = resolved || new Date();
  return Math.floor((end.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

function calcularRango(dias: number): RangoResolucion {
  if (dias === 0) return 'Mismo día';
  if (dias <= 2) return '1-2 días';
  if (dias <= 7) return '3-7 días';
  if (dias <= 14) return '1-2 semanas';
  if (dias <= 28) return '2-4 semanas';
  return 'Más de 4 semanas';
}

const ESTADOS_ABIERTOS = ['Abierto', 'En Progreso', 'En Revisión', 'Pendiente'];
const ESTADOS_CERRADOS = ['Cerrado', 'Resuelto'];
const ASIGNADOS = [
  'Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez',
  'Pedro Rodríguez', 'Laura Sánchez', 'Diego Hernández', 'Camila Torres',
  'Andrés Ramírez', 'Valentina Díaz', null,
];

function generarIncidencias(): IncidenciaClasificada[] {
  const incidencias: IncidenciaClasificada[] = [];
  let counter = 1;

  for (let year = 2024; year <= 2026; year++) {
    const cantidadPorAnio = year === 2024 ? 80 : year === 2025 ? 120 : 95;

    for (let i = 0; i < cantidadPorAnio; i++) {
      const startDate = new Date(year, 0, 1);
      const endDate = year === 2026 ? new Date(2026, 4, 5) : new Date(year, 11, 31);
      const created = randomDate(startDate, endDate);

      const esCerrada = year < 2026 ? Math.random() > 0.15 : Math.random() > 0.4;
      let resolved: Date | null = null;

      if (esCerrada) {
        const diasResolucion = Math.floor(Math.random() * 60);
        resolved = new Date(created.getTime() + diasResolucion * 24 * 60 * 60 * 1000);
        if (resolved > new Date()) resolved = null;
      }

      const producto = PRODUCTOS[Math.floor(Math.random() * PRODUCTOS.length)];
      const tribu = PRODUCTO_TRIBU_MAP[producto];
      const squad = PRODUCTO_SQUAD_MAP[producto];
      const plataforma = PLATAFORMAS[Math.floor(Math.random() * PLATAFORMAS.length)];
      const status = resolved
        ? ESTADOS_CERRADOS[Math.floor(Math.random() * ESTADOS_CERRADOS.length)]
        : ESTADOS_ABIERTOS[Math.floor(Math.random() * ESTADOS_ABIERTOS.length)];
      const assignee = ASIGNADOS[Math.floor(Math.random() * ASIGNADOS.length)];
      const edad = calcularEdad(created, resolved);

      incidencias.push({
        key: `PAT-${counter++}`,
        summary: `Incidencia ${producto} - ${plataforma}`,
        status,
        assignee,
        createdDate: created.toISOString(),
        resolvedDate: resolved?.toISOString() || null,
        producto,
        tribu,
        squad,
        plataforma,
        edadDias: edad,
        rangoResolucion: resolved ? calcularRango(edad) : null,
        jiraUrl: `https://jira.example.com/browse/PAT-${counter - 1}`,
      });
    }
  }

  return incidencias;
}

export const DEMO_INCIDENCIAS = generarIncidencias();
