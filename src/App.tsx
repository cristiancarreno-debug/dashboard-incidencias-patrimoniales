import { useState, useEffect } from 'react';
import { loadIncidencias } from './data/load-data';
import { useFilters } from './hooks/useFilters';
import { useMetrics } from './hooks/useMetrics';
import { SummaryCounters } from './components/SummaryCounters';
import { FilterBar } from './components/FilterBar';
import { MonthlyChart } from './components/MonthlyChart';
import { AnnualTable } from './components/AnnualTable';
import { PlatformPie } from './components/PlatformPie';
import { ResolutionPie } from './components/ResolutionPie';
import { IncidenciasTable } from './components/IncidenciasTable';
import { PlatformMonthlyChart } from './components/PlatformMonthlyChart';
import type { IncidenciaClasificada } from './types';

function App() {
  const [allIncidencias, setAllIncidencias] = useState<IncidenciaClasificada[]>([]);
  const [lastUpdated, setLastUpdated] = useState('Cargando...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidencias().then(({ incidencias, lastUpdated: lu }) => {
      setAllIncidencias(incidencias);
      setLastUpdated(new Date(lu).toLocaleString('es-CO'));
      setLoading(false);
    });
  }, []);

  const {
    filtros,
    incidenciasFiltradas,
    tribus,
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
  } = useFilters(allIncidencias);

  const metrics = useMetrics(incidenciasFiltradas);

  const incidenciasAbiertas = incidenciasFiltradas.filter(
    i => !['Cerrado', 'Resuelto'].includes(i.status)
  );

  const incidencias2026 = incidenciasFiltradas.filter(
    i => new Date(i.createdDate).getFullYear() === 2026
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Cargando datos de incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Dashboard de Incidencias Patrimoniales
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Seguimiento en tiempo real de incidencias por producto, tribu y squad
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Última actualización</p>
            <p className="text-sm font-medium text-slate-600">{lastUpdated}</p>
            <button
              onClick={() => {
                if (confirm('¿Deseas actualizar los datos desde Jira? Esto puede tardar unos minutos.')) {
                  window.open('https://github.com/cristiancarreno-debug/dashboard-incidencias-patrimoniales/actions/workflows/deploy.yml', '_blank');
                }
              }}
              className="mt-1 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Filtros */}
        <FilterBar
          filtros={filtros}
          tribus={tribus}
          squadsDisponibles={squadsDisponibles}
          productosDisponibles={productosDisponibles}
          plataformasDisponibles={plataformasDisponibles}
          onTribusChange={setTribus}
          onSquadsChange={setSquads}
          onProductosChange={setProductos}
          onPlataformasChange={setPlataformas}
          onFechaDesdeChange={setFechaDesde}
          onFechaHastaChange={setFechaHasta}
          onLimpiar={limpiarFiltros}
        />

        {/* Contadores */}
        <SummaryCounters
          totalGeneradas={metrics.totalGeneradas}
          totalResueltas={metrics.totalResueltas}
          totalAbiertas={metrics.totalAbiertas}
        />

        {/* Gráfico mensual */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Incidencias por Mes
          </h2>
          <MonthlyChart data={metrics.metricasMensuales} />
        </section>

        {/* Tabla comparativa anual */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Comparativa Anual
          </h2>
          <AnnualTable data={metrics.metricasAnuales} />
        </section>

        {/* Gráficos de plataforma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Incidencias por Plataforma (Mes a Mes)
            </h2>
            <PlatformMonthlyChart incidencias={incidenciasFiltradas} />
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Concentración por Plataforma
            </h2>
            <PlatformPie data={metrics.concentracionPlataforma} />
          </section>
        </div>

        {/* Gráfico de rangos de resolución */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Distribución de Tiempos de Resolución
          </h2>
          <ResolutionPie data={metrics.distribucionRangos} />
        </section>

        {/* Tabla de incidencias abiertas */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Incidencias Abiertas ({incidenciasAbiertas.length})
          </h2>
          <IncidenciasTable incidencias={incidenciasAbiertas} />
        </section>

        {/* Tabla de incidencias 2026 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Todas las Incidencias 2026 ({incidencias2026.length})
          </h2>
          <IncidenciasTable incidencias={incidencias2026} />
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-8 py-4">
        <p className="text-center text-xs text-slate-400">
          Dashboard de Incidencias Patrimoniales — Seguros Bolívar © 2026
        </p>
      </footer>
    </div>
  );
}

export default App;
