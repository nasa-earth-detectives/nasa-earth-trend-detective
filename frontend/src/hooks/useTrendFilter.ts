import { useState, useCallback } from 'react';
import { ClimateVariable } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';
import { SATELLITE_TIMELINE } from '../config/climateLayers';

export function useTrendFilter(initialVariable: ClimateVariable = 'Gistemp') {
  const [filter, setFilter] = useState<TrendFilterParams>({
    variable: initialVariable,
    startYear: 2002,
    // Abre en el año en curso, no en uno fijo.
    endYear: SATELLITE_TIMELINE.endYear,
  });

  const setVariable = useCallback((variable: ClimateVariable) => {
    setFilter((prev) => ({ ...prev, variable }));
  }, []);

  const setYearRange = useCallback((startYear: number, endYear: number) => {
    setFilter((prev) => ({ ...prev, startYear, endYear }));
  }, []);

  return {
    filter,
    setVariable,
    setYearRange,
  };
}
