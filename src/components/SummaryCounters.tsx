import { FileWarning, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  totalGeneradas: number;
  totalResueltas: number;
  totalAbiertas: number;
}

export function SummaryCounters({ totalGeneradas, totalResueltas, totalAbiertas }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 border-l-4 border-bolivar-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-content-secondary">Incidencias Generadas</p>
            <p className="text-3xl font-bold text-content-primary">{totalGeneradas}</p>
          </div>
          <FileWarning className="h-10 w-10 text-bolivar-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-content-secondary">Incidencias Resueltas</p>
            <p className="text-3xl font-bold text-content-primary">{totalResueltas}</p>
          </div>
          <CheckCircle2 className="h-10 w-10 text-green-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-shadow p-6 border-l-4 border-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-content-secondary">Incidencias Abiertas</p>
            <p className="text-3xl font-bold text-content-primary">{totalAbiertas}</p>
          </div>
          <AlertCircle className="h-10 w-10 text-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
