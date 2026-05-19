import { useIncidenciasQuery } from './hooks/useIncidenciasQuery';
import { useFilters } from './hooks/useFilters';
import { useMetrics } from './hooks/useMetrics';
import { SummaryCounters } from './components/SummaryCounters';
import { FilterBar } from './components/FilterBar';
import { MonthlyChart } from './components/MonthlyChart';
import { AnnualTable } from './components/AnnualTable';
import { GrupoAsignacionTable } from './components/GrupoAsignacionTable';
import { PlatformPie } from './components/PlatformPie';
import { ResolutionPie } from './components/ResolutionPie';
import { IncidenciasTable } from './components/IncidenciasTable';
import { PlatformMonthlyChart } from './components/PlatformMonthlyChart';

/** Calcula la próxima actualización programada (8AM, 12PM, 4PM Colombia, L-V) */
function getNextUpdate(): string {
  const now = new Date();
  // Convertir a hora Colombia (UTC-5)
  const colombiaOffset = -5 * 60;
  const localOffset = now.getTimezoneOffset();
  const colombiaTime = new Date(now.getTime() + (localOffset + colombiaOffset) * 60000);

  const hours = [8, 12, 16]; // Horas de actualización
  const currentHour = colombiaTime.getHours();
  const currentMin = colombiaTime.getMinutes();
  const dayOfWeek = colombiaTime.getDay(); // 0=Dom, 6=Sab

  // Buscar la próxima hora de actualización
  let nextDate = new Date(colombiaTime);
  let found = false;

  // Si es día laboral (L-V), buscar la próxima hora hoy
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    for (const h of hours) {
      if (h > currentHour || (h === currentHour && currentMin < 5)) {
        nextDate.setHours(h, 0, 0, 0);
        found = true;
        break;
      }
    }
  }

  // Si no se encontró hoy, buscar el próximo día laboral
  if (!found) {
    nextDate.setHours(8, 0, 0, 0);
    do {
      nextDate.setDate(nextDate.getDate() + 1);
    } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
  }

  return nextDate.toLocaleString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function App() {
  const { incidencias: allIncidencias, lastUpdated, isLoading, refetch } = useIncidenciasQuery();

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

  const metrics = useMetrics(incidenciasFiltradas, filtros.fechaDesde, filtros.fechaHasta);

  const incidenciasAbiertas = incidenciasFiltradas.filter(
    i => !['Cerrado', 'Resuelto'].includes(i.status)
  );

  const incidencias2026 = incidenciasFiltradas.filter(
    i => i.createdDate && new Date(i.createdDate).getFullYear() === 2026
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bolivar-500 mx-auto"></div>
          <p className="mt-4 text-content-secondary">Cargando datos de incidencias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border shadow-sm">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-bolivar-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-content-primary">
                Reporte de Incidencias
              </h1>
              <p className="text-sm text-content-secondary mt-0.5">
                Seguimiento en tiempo real por producto, tribu y squad
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-content-tertiary">Última actualización</p>
            <p className="text-sm font-medium text-content-secondary">{lastUpdated}</p>
            <p className="text-xs text-content-tertiary mt-1">Próxima: {getNextUpdate()}</p>
            <button
              onClick={() => { refetch(); }}
              className="mt-1 px-3 py-1.5 text-xs bg-bolivar-500 text-white rounded-lg hover:bg-bolivar-700 transition-colors font-medium"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-6 py-6 space-y-6">
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
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            Incidencias por Mes
          </h2>
          <MonthlyChart data={metrics.metricasMensuales} />
        </section>

        {/* Tabla comparativa anual + Grupo Asignación */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <section className="bg-white rounded-lg shadow p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold text-content-primary mb-4">
              Comparativa Anual
            </h2>
            <AnnualTable data={metrics.metricasAnuales} filtros={filtros} />
          </section>
          <section className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <GrupoAsignacionTable incidencias={incidenciasFiltradas} />
          </section>
        </div>

        {/* Gráficos de plataforma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">
              Incidencias por Plataforma (Mes a Mes)
            </h2>
            <PlatformMonthlyChart incidencias={incidenciasFiltradas} />
          </section>

          <section className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-content-primary mb-4">
              Concentración por Plataforma
            </h2>
            <PlatformPie data={metrics.concentracionPlataforma} />
          </section>
        </div>

        {/* Gráfico de rangos de resolución */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            Distribución de Tiempos de Resolución
          </h2>
          <ResolutionPie data={metrics.distribucionRangos} />
        </section>

        {/* Tabla de incidencias abiertas */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            Incidencias Abiertas ({incidenciasAbiertas.length})
          </h2>
          <IncidenciasTable incidencias={incidenciasAbiertas} />
        </section>

        {/* Tabla de incidencias 2026 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-content-primary mb-4">
            Todas las Incidencias 2026 ({incidencias2026.length})
          </h2>
          <IncidenciasTable incidencias={incidencias2026} />
        </section>
      </main>

      <footer className="bg-white border-t border-border mt-8 py-4">
        <p className="text-center text-xs text-content-tertiary">
          Reporte de Incidencias — Gerencia Portafolio — Seguros Bolívar © 2026
        </p>
      </footer>
    </div>
  );
}

export default App;
