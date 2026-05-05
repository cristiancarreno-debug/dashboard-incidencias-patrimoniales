import { useMemo } from 'react';
import type { IncidenciaClasificada, MetricaMensual, MetricaAnual, ConcentracionPlataforma, DistribucionRango, RangoResolucion } from '../types';

const ESTADOS_TERMINALES = ['Cerrado', 'Resuelto'];

function esTerminal(status: string): boolean {
  return ESTADOS_TERMINALES.includes(status);
}

export function useMetrics(incidencias: IncidenciaClasificada[]) {
  const totalGeneradas = incidencias.length;
  const totalResueltas = incidencias.filter(i => esTerminal(i.status)).length;
  const totalAbiertas = totalGeneradas - totalResueltas;

  const metricasMensuales = useMemo((): MetricaMensual[] => {
    const mesesMap = new Map<string, { abiertas: number; cerradas: number }>();

    incidencias.forEach(inc => {
      const mesCreacion = inc.createdDate.slice(0, 7);
      if (!mesesMap.has(mesCreacion)) mesesMap.set(mesCreacion, { abiertas: 0, cerradas: 0 });
      mesesMap.get(mesCreacion)!.abiertas++;

      if (inc.resolvedDate) {
        const mesCierre = inc.resolvedDate.slice(0, 7);
        if (!mesesMap.has(mesCierre)) mesesMap.set(mesCierre, { abiertas: 0, cerradas: 0 });
        mesesMap.get(mesCierre)!.cerradas++;
      }
    });

    const mesesOrdenados = Array.from(mesesMap.keys()).sort();
    let acumulado = 0;

    return mesesOrdenados.map(mes => {
      const data = mesesMap.get(mes)!;
      acumulado += data.abiertas - data.cerradas;
      return { mes, abiertas: data.abiertas, cerradas: data.cerradas, pendientes: acumulado };
    });
  }, [incidencias]);

  const metricasAnuales = useMemo((): MetricaAnual[] => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 2024 + 1 }, (_, i) => 2024 + i);

    return years.map(anio => {
      const delAnio = incidencias.filter(i => new Date(i.createdDate).getFullYear() === anio);
      const cerradas = delAnio.filter(i => esTerminal(i.status));
      const abiertas = delAnio.filter(i => !esTerminal(i.status));

      const totalCreadas = delAnio.length;
      const totalCerradas = cerradas.length;
      const porcentajeCierre = totalCreadas > 0 ? Math.round((totalCerradas / totalCreadas) * 10000) / 100 : 0;

      const diasCerradas = cerradas.map(i => i.edadDias);
      const promedioDiasAtencion = diasCerradas.length > 0
        ? Math.round((diasCerradas.reduce((a, b) => a + b, 0) / diasCerradas.length) * 10) / 10
        : 0;

      const incidenciaMasAntigua = abiertas.length > 0
        ? Math.max(...abiertas.map(i => i.edadDias))
        : 0;

      return { anio, totalCreadas, totalCerradas, porcentajeCierre, promedioDiasAtencion, incidenciaMasAntigua };
    });
  }, [incidencias]);

  const concentracionPlataforma = useMemo((): ConcentracionPlataforma[] => {
    const map = new Map<string, number>();
    incidencias.forEach(i => map.set(i.plataforma, (map.get(i.plataforma) || 0) + 1));
    const total = incidencias.length || 1;
    return Array.from(map.entries())
      .map(([plataforma, cantidad]) => ({
        plataforma,
        cantidad,
        porcentaje: Math.round((cantidad / total) * 10000) / 100,
      }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [incidencias]);

  const distribucionRangos = useMemo((): DistribucionRango[] => {
    const cerradas = incidencias.filter(i => i.rangoResolucion !== null);
    const map = new Map<RangoResolucion, number>();
    const rangos: RangoResolucion[] = ['Mismo día', '1-2 días', '3-7 días', '1-2 semanas', '2-4 semanas', 'Más de 4 semanas'];
    rangos.forEach(r => map.set(r, 0));
    cerradas.forEach(i => map.set(i.rangoResolucion!, (map.get(i.rangoResolucion!) || 0) + 1));
    const total = cerradas.length || 1;
    return rangos.map(rango => ({
      rango,
      cantidad: map.get(rango) || 0,
      porcentaje: Math.round(((map.get(rango) || 0) / total) * 10000) / 100,
    }));
  }, [incidencias]);

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
