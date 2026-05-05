import { FileWarning, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  totalGeneradas: number;
  totalResueltas: number;
  totalAbiertas: number;
}

export function SummaryCounters({ totalGeneradas, totalResueltas, totalAbiertas }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Incidencias Generadas</p>
            <p className="text-3xl font-bold text-slate-800">{totalGeneradas}</p>
          </div>
          <FileWarning className="h-10 w-10 text-blue-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Incidencias Resueltas</p>
            <p className="text-3xl font-bold text-slate-800">{totalResueltas}</p>
          </div>
          <CheckCircle2 className="h-10 w-10 text-green-500 opacity-80" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-amber-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Incidencias Abiertas</p>
            <p className="text-3xl font-bold text-slate-800">{totalAbiertas}</p>
          </div>
          <AlertCircle className="h-10 w-10 text-amber-500 opacity-80" />
        </div>
      </div>
    </div>
  );
}
