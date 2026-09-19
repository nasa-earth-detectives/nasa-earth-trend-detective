import { useState, useCallback } from 'react';
import { ClimateVariable } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';

export function useTrendFilter(initialVariable: ClimateVariable = 'Gistemp') {
  const [filter, setFilter] = useState<TrendFilterParams>({
    variable: initialVariable,
    startYear: 2002,
    endYear: 2024,
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
