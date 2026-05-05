import { useState, useMemo, useCallback } from 'react';
import type { FiltrosIncidencias, IncidenciaClasificada, Tribu, Squad, Producto } from '../types';

export function useFilters(incidencias: IncidenciaClasificada[]) {
  const [filtros, setFiltros] = useState<FiltrosIncidencias>({});

  // Extraer opciones únicas de los datos reales
  const todasTribus = useMemo(() => {
    const set = new Set(incidencias.map(i => i.tribu));
    return Array.from(set).sort() as Tribu[];
  }, [incidencias]);

  const todosSquads = useMemo(() => {
    const set = new Set(incidencias.map(i => i.squad));
    return Array.from(set).sort() as Squad[];
  }, [incidencias]);

  // Opciones filtradas por cascada
  const squadsDisponibles = useMemo(() => {
    if (!filtros.tribu) return todosSquads;
    const filtered = incidencias.filter(i => i.tribu === filtros.tribu);
    const set = new Set(filtered.map(i => i.squad));
    return Array.from(set).sort() as Squad[];
  }, [incidencias, filtros.tribu, todosSquads]);

  const productosDisponibles = useMemo(() => {
    let filtered = incidencias;
    if (filtros.tribu) filtered = filtered.filter(i => i.tribu === filtros.tribu);
    if (filtros.squad) filtered = filtered.filter(i => i.squad === filtros.squad);
    const set = new Set(filtered.map(i => i.producto));
    return Array.from(set).sort() as Producto[];
  }, [incidencias, filtros.tribu, filtros.squad]);

  const plataformasDisponibles = useMemo(() => {
    const set = new Set(incidencias.map(i => i.plataforma));
    return Array.from(set).sort();
  }, [incidencias]);

  // Aplicar filtros
  const incidenciasFiltradas = useMemo(() => {
    return incidencias.filter(inc => {
      if (filtros.tribu && inc.tribu !== filtros.tribu) return false;
      if (filtros.squad && inc.squad !== filtros.squad) return false;
      if (filtros.producto && inc.producto !== filtros.producto) return false;
      if (filtros.plataforma && inc.plataforma !== filtros.plataforma) return false;
      if (filtros.fechaDesde) {
        const incDate = inc.createdDate.slice(0, 10);
        const desde = filtros.fechaDesde.slice(0, 10);
        if (incDate < desde) return false;
      }
      if (filtros.fechaHasta) {
        const incDate = inc.createdDate.slice(0, 10);
        const hasta = filtros.fechaHasta.slice(0, 10);
        if (incDate > hasta) return false;
      }
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
    tribus: todasTribus,
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
