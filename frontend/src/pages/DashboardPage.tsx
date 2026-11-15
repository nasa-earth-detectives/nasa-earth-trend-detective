import { useCallback, useMemo, useState } from 'react';
import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { DetectiveWizard, type WizardResult } from '../components/Detective/DetectiveWizard';
import { regionLocation, type RegionScope, type WizardRegion } from '../config/wizardOptions';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { useDetectiveWizard } from '../hooks/useDetectiveWizard';
import type { ClimateVariable } from '../types/climate.types';
import type { SelectedLocation } from '../hooks/useImmersiveUi';
import { VARIABLE_IDS } from '../config/climateLayers';
import '../styles/detective-wizard.css';

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
    const variable = VARIABLE_IDS.includes(varParam) ? varParam : 'Gistemp';
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
  const [focusLocation, setFocusLocation] = useState<SelectedLocation | null>(null);
  // The third answer of the briefing: the years the analysis covers, independent of the year shown on the globe.
  const [analysisPeriod, setAnalysisPeriod] = useState<{ startYear: number; endYear: number } | null>(null);

  const handleWizardComplete = useCallback((result: WizardResult) => {
    setVariable(result.variable);
    setYearRange(result.startYear, result.endYear);
    // The "region" step previously had no effect: now it flies the globe to that location and opens its analysis.
    if (result.region.id !== 'custom') setFocusLocation(regionLocation(result.region, result.scope));
    setAnalysisPeriod({ startYear: result.startYear, endYear: result.endYear });
    wizard.dismiss();
  }, [setVariable, setYearRange, wizard.dismiss]);
  // Preview: while choosing in the wizard, the globe already displays the variable and turns to the location.
  const [previewLocation, setPreviewLocation] = useState<SelectedLocation | null>(null);
  const handlePreviewRegion = useCallback((region: WizardRegion, scope: RegionScope) => {
    setPreviewLocation(region.id !== 'custom' ? regionLocation(region, scope) : null);
  }, []);
  const handleYearChange = useCallback((year: number) => setYearRange(Math.min(filter.startYear, year), year),
    [setYearRange, filter.startYear]);

  // If the user arrived via a share link with a specific location, do not show the wizard on top
  const showWizard = wizard.open && !queryConfig.location;

  return (
    <>
      {showWizard && (
        <DetectiveWizard
          initialVariable={filter.variable}
          onComplete={handleWizardComplete}
          onSkip={wizard.dismiss}
          onPreviewVariable={setVariable}
          onPreviewRegion={handlePreviewRegion}
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
        focusLocation={focusLocation}
        analysisPeriod={analysisPeriod}
        previewLocation={showWizard ? previewLocation : null}
        briefingOpen={showWizard}
        onVariableChange={setVariable}
        onYearChange={handleYearChange}
        onOpenWizard={wizard.reopen}
      />
    </>
  );
}
