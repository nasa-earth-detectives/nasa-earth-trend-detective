import { useState, useEffect } from 'react';
import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { trendService } from '../services/trendService';

/**
 * Punto de entrada de la experiencia.
 *
 * Solo resuelve el estado científico (filtro, observaciones, salud de la API)
 * y lo entrega al layout inmersivo, que gobierna la presentación.
 */
export function DashboardPage() {
  const { filter, setVariable, setYearRange } = useTrendFilter('Gistemp');
  const { data: observations, loading, error } = useGlobeData(filter);
  const [apiConnected, setApiConnected] = useState<boolean>(false);

  useEffect(() => {
    trendService
      .getHealth()
      .then((res) => setApiConnected(res.status === 'Healthy'))
      .catch(() => setApiConnected(false));
  }, []);

  return (
    <ImmersiveEarthLayout
      observations={observations}
      loading={loading}
      observationError={error}
      apiConnected={apiConnected}
      filter={filter}
      onVariableChange={setVariable}
      onYearChange={(year) => setYearRange(filter.startYear, year)}
    />
  );
}
