import { useCallback, useMemo } from 'react';
import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { DetectiveWizard, type WizardResult } from '../components/Detective/DetectiveWizard';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { useDetectiveWizard } from '../hooks/useDetectiveWizard';
import type { ClimateVariable } from '../types/climate.types';
import type { SelectedLocation } from '../hooks/useImmersiveUi';
import '../styles/detective-wizard.css';

const VALID_VARIABLES: ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];

/**
 * Experience entry point.
 * Supports URL share links (?variable=...&lat=...&lng=...&year=...)
 * and "Trend Detective" welcome wizard to guide students.
 */
export function DashboardPage() {
  const queryConfig = useMemo(() => {
    if (typeof window === 'undefined') return { variable: 'Gistemp' as ClimateVariable, location: null, year: undefined };
    const params = new URLSearchParams(window.location.search);
    const varParam = params.get('variable') as ClimateVariable;
    const variable = VALID_VARIABLES.includes(varParam) ? varParam : 'Gistemp';
    const latStr = params.get('lat');
    const lngStr = params.get('lng');
    const yearStr = params.get('year');
    const year = yearStr ? parseInt(yearStr, 10) : undefined;

    let location: SelectedLocation | null = null;
    if (latStr !== null && lngStr !== null) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        location = { lat, lng };
      }
    }
    return { variable, location, year: isNaN(year ?? NaN) ? undefined : year };
  }, []);

  const { filter, setVariable, setYearRange } = useTrendFilter(queryConfig.variable, queryConfig.year);
  const { data: observations, loading, error, source, provenance } = useGlobeData(filter);
  const wizard = useDetectiveWizard();

  const handleWizardComplete = useCallback((result: WizardResult) => {
    setVariable(result.variable);
    setYearRange(result.startYear, result.endYear);
    wizard.dismiss();
  }, [setVariable, setYearRange, wizard.dismiss]);

  // If the user arrived via a share link with a specific location, do not show the wizard on top
  const showWizard = wizard.open && !queryConfig.location;

  return (
    <>
      {showWizard && (
        <DetectiveWizard
          onComplete={handleWizardComplete}
          onSkip={wizard.dismiss}
        />
      )}
      <ImmersiveEarthLayout
        observations={observations}
        loading={loading}
        observationError={error}
        source={source}
        provenance={provenance}
        filter={filter}
        initialLocation={queryConfig.location}
        onVariableChange={setVariable}
        onYearChange={(year) => setYearRange(Math.min(filter.startYear, year), year)}
        onOpenWizard={wizard.reopen}
      />
    </>
  );
}
