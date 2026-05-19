import { useState, useMemo, useCallback } from 'react';

/** Tipo de filtro soportado */
type FilterType = 'multi' | 'single' | 'dateRange';

/** Configuración de un filtro individual */
interface FilterDefinition<T> {
  type: FilterType;
  field: keyof T & string;
  cascadeTo?: string[];
  comparison?: 'gte' | 'lte';
}

/** Configuración completa de filtros */
export type FilterConfig<T> = Record<string, FilterDefinition<T>>;

/** Valor posible de un filtro */
export type FilterValue = string[] | string | undefined;

/** Estado de todos los filtros activos */
export type FilterState = Record<string, FilterValue>;

/** Resultado retornado por el hook */
interface UseGenericFiltersReturn<T> {
  filtered: T[];
  filters: FilterState;
  setFilter: (key: string, value: FilterValue) => void;
  clearFilter: (key: string) => void;
  clearAll: () => void;
  getOptions: (key: string) => string[];
}

function getCascadeKeys<T>(key: string, config: FilterConfig<T>): string[] {
  const definition = config[key];
  if (!definition?.cascadeTo) return [];
  const result: string[] = [];
  for (const dep of definition.cascadeTo) {
    result.push(dep);
    result.push(...getCascadeKeys(dep, config));
  }
  return [...new Set(result)];
}

function getParentKeys<T>(key: string, config: FilterConfig<T>): string[] {
  const parents: string[] = [];
  for (const k of Object.keys(config)) {
    if (k === key) continue;
    const cascades = getCascadeKeys(k, config);
    if (cascades.includes(key)) parents.push(k);
  }
  return parents;
}

/**
 * Hook genérico para filtrado de datos con cascada, multi-select y dateRange.
 *
 * @example
 * ```tsx
 * const { filtered, setFilter, clearAll, getOptions } = useGenericFilters(data, {
 *   tribu: { type: 'multi', field: 'tribu', cascadeTo: ['squad'] },
 *   squad: { type: 'multi', field: 'squad' },
 *   fechaDesde: { type: 'dateRange', field: 'createdDate', comparison: 'gte' },
 * });
 * ```
 */
export function useGenericFilters<T extends Record<string, unknown>>(
  data: T[],
  config: FilterConfig<T>,
): UseGenericFiltersReturn<T> {
  const [filters, setFilters] = useState<FilterState>({});

  const filtered = useMemo(() => {
    return data.filter((item) => {
      for (const [key, definition] of Object.entries(config)) {
        const value = filters[key];
        if (value === undefined || (Array.isArray(value) && value.length === 0)) continue;

        const fieldValue = item[definition.field];

        if (definition.type === 'multi') {
          const selected = value as string[];
          if (!selected.includes(String(fieldValue))) return false;
        }
        if (definition.type === 'single') {
          if (String(fieldValue) !== String(value)) return false;
        }
        if (definition.type === 'dateRange') {
          const dateStr = String(fieldValue).slice(0, 10);
          const compareStr = String(value).slice(0, 10);
          if (definition.comparison === 'gte' && dateStr < compareStr) return false;
          if (definition.comparison === 'lte' && dateStr > compareStr) return false;
        }
      }
      return true;
    });
  }, [data, config, filters]);

  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      setFilters((prev) => {
        const next = { ...prev };
        if (value === undefined || (Array.isArray(value) && value.length === 0)) {
          delete next[key];
        } else {
          next[key] = value;
        }
        const cascadeKeys = getCascadeKeys(key, config);
        for (const ck of cascadeKeys) delete next[ck];
        return next;
      });
    },
    [config],
  );

  const clearFilter = useCallback(
    (key: string) => {
      setFilters((prev) => {
        const next = { ...prev };
        delete next[key];
        const cascadeKeys = getCascadeKeys(key, config);
        for (const ck of cascadeKeys) delete next[ck];
        return next;
      });
    },
    [config],
  );

  const clearAll = useCallback(() => { setFilters({}); }, []);

  const getOptions = useCallback(
    (key: string): string[] => {
      const definition = config[key];
      if (!definition || definition.type === 'dateRange') return [];

      const parentKeys = getParentKeys(key, config);

      const constrainedData = data.filter((item) => {
        for (const parentKey of parentKeys) {
          const parentDef = config[parentKey];
          const parentValue = filters[parentKey];
          if (parentValue === undefined || (Array.isArray(parentValue) && parentValue.length === 0)) continue;

          const fieldValue = item[parentDef.field];
          if (parentDef.type === 'multi') {
            if (!(parentValue as string[]).includes(String(fieldValue))) return false;
          }
          if (parentDef.type === 'single') {
            if (String(fieldValue) !== String(parentValue)) return false;
          }
          if (parentDef.type === 'dateRange') {
            const dateStr = String(fieldValue).slice(0, 10);
            const compareStr = String(parentValue).slice(0, 10);
            if (parentDef.comparison === 'gte' && dateStr < compareStr) return false;
            if (parentDef.comparison === 'lte' && dateStr > compareStr) return false;
          }
        }
        return true;
      });

      const values = new Set<string>();
      for (const item of constrainedData) {
        const val = item[definition.field];
        if (val !== null && val !== undefined && val !== '') values.add(String(val));
      }
      return Array.from(values).sort();
    },
    [data, config, filters],
  );

  return { filtered, filters, setFilter, clearFilter, clearAll, getOptions };
}
