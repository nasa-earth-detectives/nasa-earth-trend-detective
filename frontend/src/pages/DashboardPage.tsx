import { useCallback, useMemo, useState } from 'react';
import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { DetectiveWizard, type WizardResult } from '../components/Detective/DetectiveWizard';
import type { WizardRegion } from '../config/wizardOptions';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { useDetectiveWizard } from '../hooks/useDetectiveWizard';
import type { ClimateVariable } from '../types/climate.types';
import type { SelectedLocation } from '../hooks/useImmersiveUi';
import { VARIABLE_IDS } from '../config/climateLayers';
import '../styles/detective-wizard.css';

/**
 * Punto de entrada de la experiencia.
 * Soporta enlace compartido por URL (?variable=...&lat=...&lng=...&year=...)
 * y Wizard de bienvenida "Detective de Tendencias" para guiar a estudiantes.
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

  const handleWizardComplete = useCallback((result: WizardResult) => {
    setVariable(result.variable);
    setYearRange(result.startYear, result.endYear);
    // El paso "región" se elegía y no hacía nada: ahora lleva el globo a ese lugar y abre su análisis.
    if (result.region.id !== 'custom') setFocusLocation({ lat: result.region.lat, lng: result.region.lng });
    wizard.dismiss();
  }, [setVariable, setYearRange, wizard.dismiss]);
  // Vista previa: mientras se elige en el asistente, el globo ya enseña la variable y gira al lugar.
  const [previewLocation, setPreviewLocation] = useState<SelectedLocation | null>(null);
  const handlePreviewRegion = useCallback((region: WizardRegion) => {
    if (region.id !== 'custom') setPreviewLocation({ lat: region.lat, lng: region.lng });
  }, []);
  const handleYearChange = useCallback((year: number) => setYearRange(Math.min(filter.startYear, year), year),
    [setYearRange, filter.startYear]);

  // Si el usuario ingresó por un enlace compartido con ubicación específica, no mostramos el wizard encima
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
        previewLocation={showWizard ? previewLocation : null}
        briefingOpen={showWizard}
        onVariableChange={setVariable}
        onYearChange={handleYearChange}
        onOpenWizard={wizard.reopen}
      />
    </>
  );
}
