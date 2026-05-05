import { useState, useMemo, useCallback } from 'react';
import type { FiltrosIncidencias, IncidenciaClasificada, Tribu, Squad, Producto } from '../types';
import { PRODUCTO_TRIBU_MAP, PRODUCTO_SQUAD_MAP, PRODUCTOS, SQUADS } from '../data/mappings';

export function useFilters(incidencias: IncidenciaClasificada[]) {
  const [filtros, setFiltros] = useState<FiltrosIncidencias>({});

  const squadsDisponibles = useMemo(() => {
    if (!filtros.tribu) return SQUADS;
    const productosDeTribu = PRODUCTOS.filter(p => PRODUCTO_TRIBU_MAP[p] === filtros.tribu);
    const squadsSet = new Set(productosDeTribu.map(p => PRODUCTO_SQUAD_MAP[p]));
    return SQUADS.filter(s => squadsSet.has(s));
  }, [filtros.tribu]);

  const productosDisponibles = useMemo(() => {
    let filtered = [...PRODUCTOS];
    if (filtros.tribu) {
      filtered = filtered.filter(p => PRODUCTO_TRIBU_MAP[p] === filtros.tribu);
    }
    if (filtros.squad) {
      filtered = filtered.filter(p => PRODUCTO_SQUAD_MAP[p] === filtros.squad);
    }
    return filtered;
  }, [filtros.tribu, filtros.squad]);

  const plataformasDisponibles = useMemo(() => {
    const set = new Set(incidencias.map(i => i.plataforma));
    return Array.from(set).sort();
  }, [incidencias]);

  const incidenciasFiltradas = useMemo(() => {
    return incidencias.filter(inc => {
      if (filtros.tribu && inc.tribu !== filtros.tribu) return false;
      if (filtros.squad && inc.squad !== filtros.squad) return false;
      if (filtros.producto && inc.producto !== filtros.producto) return false;
      if (filtros.plataforma && inc.plataforma !== filtros.plataforma) return false;
      if (filtros.fechaDesde && inc.createdDate < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && inc.createdDate > filtros.fechaHasta) return false;
      return true;
    });
  }, [incidencias, filtros]);

  const setTribu = useCallback((tribu?: Tribu) => {
    setFiltros(prev => ({ ...prev, tribu, squad: undefined, producto: undefined }));
  }, []);

  const setSquad = useCallback((squad?: Squad) => {
    setFiltros(prev => ({ ...prev, squad, producto: undefined }));
  }, []);

  const setProducto = useCallback((producto?: Producto) => {
    setFiltros(prev => ({ ...prev, producto }));
  }, []);

  const setPlataforma = useCallback((plataforma?: string) => {
    setFiltros(prev => ({ ...prev, plataforma }));
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
    squadsDisponibles,
    productosDisponibles,
    plataformasDisponibles,
    setTribu,
    setSquad,
    setProducto,
    setPlataforma,
    setFechaDesde,
    setFechaHasta,
    limpiarFiltros,
  };
}
