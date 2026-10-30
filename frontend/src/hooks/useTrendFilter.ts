import { useState, useCallback } from 'react';
import { ClimateVariable } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';
import { SATELLITE_TIMELINE } from '../config/climateLayers';

export function useTrendFilter(
  initialVariable: ClimateVariable = 'Gistemp',
  initialYear: number = SATELLITE_TIMELINE.endYear
) {
  const [filter, setFilter] = useState<TrendFilterParams>({
    variable: initialVariable,
    startYear: 2002,
    endYear: Math.max(SATELLITE_TIMELINE.startYear, Math.min(SATELLITE_TIMELINE.endYear, initialYear)),
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
