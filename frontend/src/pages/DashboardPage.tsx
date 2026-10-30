import { useCallback } from 'react';
import { ImmersiveEarthLayout } from '../components/Layout/ImmersiveEarthLayout';
import { DetectiveWizard, type WizardResult } from '../components/Detective/DetectiveWizard';
import { useTrendFilter } from '../hooks/useTrendFilter';
import { useGlobeData } from '../hooks/useGlobeData';
import { useDetectiveWizard } from '../hooks/useDetectiveWizard';
import '../styles/detective-wizard.css';

/**
 * Punto de entrada de la experiencia.
 *
 * Gestiona el estado científico (filtro, observaciones, salud de la API)
 * y el wizard de bienvenida "Detective de Tendencias". Cuando el usuario
 * completa el wizard, el globo se configura automáticamente con su selección.
 */
export function DashboardPage() {
  const { filter, setVariable, setYearRange } = useTrendFilter('Gistemp');
  const { data: observations, loading, error, source, provenance } = useGlobeData(filter);
  const wizard = useDetectiveWizard();

  /** Cuando el usuario completa el wizard aplicamos su selección al globo. */
  const handleWizardComplete = useCallback((result: WizardResult) => {
    setVariable(result.variable);
    setYearRange(result.startYear, result.endYear);
    wizard.dismiss();
    // Si eligió una región predefinida (no "custom"), el globo se posiciona ahí.
    // La señal de navegación se emite a través del state; el globo reacciona
    // al cambio de variable y el usuario puede hacer clic en la región sugerida.
  }, [setVariable, setYearRange, wizard.dismiss]);

  return (
    <>
      {wizard.open && (
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
        onVariableChange={setVariable}
        onYearChange={(year) => setYearRange(Math.min(filter.startYear, year), year)}
        onOpenWizard={wizard.reopen}
      />
    </>
  );
}
