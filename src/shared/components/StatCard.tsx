import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';

/** Colores disponibles para StatCard. */
export type StatCardColor = 'blue' | 'green' | 'amber' | 'red' | 'purple';

/** Información de tendencia para StatCard. */
export interface StatCardTrend {
  value: number;
  direction: 'up' | 'down';
}

/** Props del componente StatCard. */
export interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  color: StatCardColor;
  trend?: StatCardTrend;
}

const COLOR_MAP: Record<StatCardColor, { border: string; icon: string; trend: string }> = {
  blue: { border: 'border-l-blue-500', icon: 'text-blue-500', trend: 'text-blue-600' },
  green: { border: 'border-l-green-500', icon: 'text-green-500', trend: 'text-green-600' },
  amber: { border: 'border-l-amber-500', icon: 'text-amber-500', trend: 'text-amber-600' },
  red: { border: 'border-l-red-500', icon: 'text-red-500', trend: 'text-red-600' },
  purple: { border: 'border-l-purple-500', icon: 'text-purple-500', trend: 'text-purple-600' },
};

/**
 * Tarjeta de estadística con icono, valor, etiqueta y tendencia opcional.
 */
export function StatCard({ icon: Icon, label, value, color, trend }: StatCardProps) {
  const colors = COLOR_MAP[color];

  return (
    <div className={cn('bg-white rounded-lg shadow p-6 border-l-4', colors.border)}>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-3xl font-bold text-slate-800">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-1">
              {trend.direction === 'up' ? (
                <TrendingUp className={cn('h-3.5 w-3.5', colors.trend)} />
              ) : (
                <TrendingDown className={cn('h-3.5 w-3.5', colors.trend)} />
              )}
              <span className={cn('text-xs font-medium', colors.trend)}>{trend.value}%</span>
            </div>
          )}
        </div>
        <Icon className={cn('h-10 w-10 opacity-80', colors.icon)} />
      </div>
    </div>
  );
}

/**
 * Grid responsive para StatCards.
 */
export function StatCardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {children}
    </div>
  );
}
