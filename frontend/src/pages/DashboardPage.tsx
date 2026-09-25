import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';

/**
 * Punto de entrada de la experiencia.
 *
 * Solo resuelve el estado científico (filtro, observaciones, salud de la API)
 * y lo entrega al layout inmersivo, que gobierna la presentación.
 */
export function DashboardPage() {
  const { filter, setVariable, setYearRange } = useTrendFilter('Gistemp');
  const { data: observations, loading, error, source } = useGlobeData(filter);

  return (
    <ImmersiveEarthLayout
      observations={observations}
      loading={loading}
      observationError={error}
      source={source}
      filter={filter}
      onVariableChange={setVariable}
      onYearChange={(year) => setYearRange(Math.min(filter.startYear, year), year)}
    />
  );
}
