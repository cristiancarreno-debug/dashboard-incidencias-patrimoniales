export type Producto =
  | 'Autos' | 'SOAT' | 'Hogar' | 'Cumplimiento'
  | 'Obra al día' | 'Cuotas al día' | 'Zonas comunes'
  | 'Pymes' | 'Decenal' | 'Agro' | 'Arrendamiento'
  | 'Transporte' | 'Maquinaria' | 'Sin clasificar';

export type Tribu =
  | 'Tribu de Movilidad'
  | 'Tribu de Vivienda'
  | 'Tribu de Empresas'
  | 'Sin clasificar';

export type Squad =
  | 'Squad Movilidad' | 'Squad Hogar' | 'Squad Copropiedades'
  | 'Squad Decenal y Maquinaria' | 'Squad Pymes'
  | 'Squad Cumplimiento' | 'Squad Agro y transporte'
  | 'Squad Arrendamiento' | 'Sin clasificar';

export type RangoResolucion =
  | 'Mismo día'
  | '1-2 días'
  | '3-7 días'
  | '1-2 semanas'
  | '2-4 semanas'
  | 'Más de 4 semanas';

export interface IncidenciaClasificada {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  createdDate: string;
  resolvedDate: string | null;
  producto: Producto;
  tribu: Tribu;
  squad: Squad;
  plataforma: string;
  edadDias: number;
  rangoResolucion: RangoResolucion | null;
  jiraUrl: string;
}

export interface MetricaMensual {
  mes: string;
  abiertas: number;
  cerradas: number;
  pendientes: number;
}

export interface MetricaAnual {
  anio: number;
  totalCreadas: number;
  totalCerradas: number;
  porcentajeCierre: number;
  promedioDiasAtencion: number;
  incidenciaMasAntigua: number;
}

export interface ConcentracionPlataforma {
  plataforma: string;
  cantidad: number;
  porcentaje: number;
}

export interface DistribucionRango {
  rango: RangoResolucion;
  cantidad: number;
  porcentaje: number;
}

export interface PlataformaMensual {
  mes: string;
  plataforma: string;
  cantidad: number;
}

export interface FiltrosIncidencias {
  tribu?: Tribu;
  squad?: Squad;
  producto?: Producto;
  plataforma?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}
