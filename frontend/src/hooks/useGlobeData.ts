import { useState, useEffect } from 'react';
import { ClimateObservation } from '../types/climate.types';
import { TrendFilterParams } from '../types/trend.types';
import { trendService } from '../services/trendService';

export function useGlobeData(filter: TrendFilterParams) {
  const [data, setData] = useState<ClimateObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setData([]);
    setLoading(true);
    setError(null);

    trendService
      .getObservations(filter.variable, filter.endYear)
      .then((observations) => {
        if (isMounted) {
          setData(observations);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Error al obtener observaciones');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filter.variable, filter.endYear]);

  return { data, loading, error };
}
