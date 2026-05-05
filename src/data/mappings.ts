import type { Producto, Tribu, Squad } from '../types';

export const PRODUCTO_TRIBU_MAP: Record<Exclude<Producto, 'Sin clasificar'>, Tribu> = {
  'Autos': 'Tribu de Movilidad',
  'SOAT': 'Tribu de Movilidad',
  'Hogar': 'Tribu de Vivienda',
  'Cuotas al día': 'Tribu de Vivienda',
  'Obra al día': 'Tribu de Vivienda',
  'Zonas comunes': 'Tribu de Vivienda',
  'Decenal': 'Tribu de Vivienda',
  'Maquinaria': 'Tribu de Vivienda',
  'Agro': 'Tribu de Empresas',
  'Pymes': 'Tribu de Empresas',
  'Cumplimiento': 'Tribu de Empresas',
  'Transporte': 'Tribu de Empresas',
  'Arrendamiento': 'Tribu de Vivienda',
};

export const PRODUCTO_SQUAD_MAP: Record<Exclude<Producto, 'Sin clasificar'>, Squad> = {
  'Autos': 'Squad Movilidad',
  'SOAT': 'Squad Movilidad',
  'Hogar': 'Squad Hogar',
  'Obra al día': 'Squad Copropiedades',
  'Cuotas al día': 'Squad Copropiedades',
  'Zonas comunes': 'Squad Copropiedades',
  'Decenal': 'Squad Decenal y Maquinaria',
  'Maquinaria': 'Squad Decenal y Maquinaria',
  'Pymes': 'Squad Pymes',
  'Cumplimiento': 'Squad Cumplimiento',
  'Agro': 'Squad Agro y transporte',
  'Transporte': 'Squad Agro y transporte',
  'Arrendamiento': 'Squad Arrendamiento',
};

export const PRODUCTOS: Exclude<Producto, 'Sin clasificar'>[] = [
  'Autos', 'SOAT', 'Hogar', 'Cumplimiento', 'Obra al día',
  'Cuotas al día', 'Zonas comunes', 'Pymes', 'Decenal',
  'Agro', 'Arrendamiento', 'Transporte', 'Maquinaria',
];

export const TRIBUS: Exclude<Tribu, 'Sin clasificar'>[] = [
  'Tribu de Movilidad', 'Tribu de Vivienda', 'Tribu de Empresas',
];

export const SQUADS: Exclude<Squad, 'Sin clasificar'>[] = [
  'Squad Movilidad', 'Squad Hogar', 'Squad Copropiedades',
  'Squad Decenal y Maquinaria', 'Squad Pymes',
  'Squad Cumplimiento', 'Squad Agro y transporte', 'Squad Arrendamiento',
];

export const PLATAFORMAS = [
  'Portal Web', 'App Móvil', 'Core Seguros', 'Pasarela de Pagos',
  'API Gateway', 'Backoffice', 'Sin plataforma',
];
