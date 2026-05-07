import { useState, useMemo, useCallback } from 'react';
import type { FiltrosIncidencias, IncidenciaClasificada } from '../types';

export function useFilters(incidencias: IncidenciaClasificada[]) {
  const [filtros, setFiltros] = useState<FiltrosIncidencias>({});

  // Extraer opciones únicas de los datos reales
  const todasTribus = useMemo(() => {
    const set = new Set(incidencias.map(i => i.tribu));
    return Array.from(set).sort();
  }, [incidencias]);

  const todosSquads = useMemo(() => {
    const set = new Set(incidencias.map(i => i.squad));
    return Array.from(set).sort();
  }, [incidencias]);

  // Opciones filtradas por cascada (basadas en datos reales)
  const squadsDisponibles = useMemo(() => {
    if (!filtros.tribus || filtros.tribus.length === 0) return todosSquads;
    const filtered = incidencias.filter(i => filtros.tribus!.includes(i.tribu));
    const set = new Set(filtered.map(i => i.squad));
    return Array.from(set).sort();
  }, [incidencias, filtros.tribus, todosSquads]);

  const productosDisponibles = useMemo(() => {
    let filtered = incidencias;
    if (filtros.tribus && filtros.tribus.length > 0) filtered = filtered.filter(i => filtros.tribus!.includes(i.tribu));
    if (filtros.squads && filtros.squads.length > 0) filtered = filtered.filter(i => filtros.squads!.includes(i.squad));
    const set = new Set(filtered.map(i => i.producto));
    return Array.from(set).sort();
  }, [incidencias, filtros.tribus, filtros.squads]);

  const plataformasDisponibles = useMemo(() => {
    let filtered = incidencias;
    if (filtros.tribus && filtros.tribus.length > 0) filtered = filtered.filter(i => filtros.tribus!.includes(i.tribu));
    if (filtros.squads && filtros.squads.length > 0) filtered = filtered.filter(i => filtros.squads!.includes(i.squad));
    if (filtros.productos && filtros.productos.length > 0) filtered = filtered.filter(i => filtros.productos!.includes(i.producto));
    const set = new Set(filtered.map(i => i.plataforma));
    return Array.from(set).sort();
  }, [incidencias, filtros.tribus, filtros.squads, filtros.productos]);

  // Aplicar filtros (multi-selección)
  const incidenciasFiltradas = useMemo(() => {
    return incidencias.filter(inc => {
      if (filtros.tribus && filtros.tribus.length > 0 && !filtros.tribus.includes(inc.tribu)) return false;
      if (filtros.squads && filtros.squads.length > 0 && !filtros.squads.includes(inc.squad)) return false;
      if (filtros.productos && filtros.productos.length > 0 && !filtros.productos.includes(inc.producto)) return false;
      if (filtros.plataformas && filtros.plataformas.length > 0 && !filtros.plataformas.includes(inc.plataforma)) return false;
      if (filtros.fechaDesde) {
        const incDate = inc.createdDate.slice(0, 10);
        if (incDate < filtros.fechaDesde.slice(0, 10)) return false;
      }
      if (filtros.fechaHasta) {
        const incDate = inc.createdDate.slice(0, 10);
        if (incDate > filtros.fechaHasta.slice(0, 10)) return false;
      }
      return true;
    });
  }, [incidencias, filtros]);

  const setTribus = useCallback((tribus: string[]) => {
    setFiltros(prev => ({ ...prev, tribus: tribus.length > 0 ? tribus : undefined, squads: undefined, productos: undefined }));
  }, []);

  const setSquads = useCallback((squads: string[]) => {
    setFiltros(prev => ({ ...prev, squads: squads.length > 0 ? squads : undefined, productos: undefined }));
  }, []);

  const setProductos = useCallback((productos: string[]) => {
    setFiltros(prev => ({ ...prev, productos: productos.length > 0 ? productos : undefined }));
  }, []);

  const setPlataformas = useCallback((plataformas: string[]) => {
    setFiltros(prev => ({ ...prev, plataformas: plataformas.length > 0 ? plataformas : undefined }));
  }, []);

  const setFechaDesde = useCallback((fechaDesde?: string) => {
    setFiltros(prev => ({ ...prev, fechaDesde }));
  }, []);

  const setFechaHasta = useCallback((fechaHasta?: string) => {
    setFiltros(prev => ({ ...prev, fechaHasta }));
  }, []);

  const limpiarFiltros = useCallback(() => {
    setFiltros({});
  }, []);

  return {
    filtros,
    incidenciasFiltradas,
    tribus: todasTribus,
    squadsDisponibles,
    productosDisponibles,
    plataformasDisponibles,
    setTribus,
    setSquads,
    setProductos,
    setPlataformas,
    setFechaDesde,
    setFechaHasta,
    limpiarFiltros,
  };
}
