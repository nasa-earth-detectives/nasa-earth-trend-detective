/**
 * DetectiveWizard.tsx
 *
 * Expediente de inicio "Detective de tendencias": tres preguntas (qué, dónde, cuántos años) que son
 * exactamente las del reto NASA Space Apps 2026 "Be An Earth System Trend Detective!".
 *
 * Va acoplado a un lado y no como modal centrado: el globo es la pieza principal del instrumento y
 * tiene que seguir a la vista. Cada elección se refleja en él al momento (variable y lugar).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { DatasetCatalog } from '../../types/dataset.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { WIZARD_REGIONS, WIZARD_PERIODS, type WizardRegion, type WizardPeriod } from '../../config/wizardOptions';
import { getDatasetCatalog } from '../../services/datasetCatalog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { RegionStep, VariableStep } from './DetectiveWizardSteps';
import { PeriodStep } from './DetectiveWizardPeriod';
import '../../styles/detective-wizard.css';

export interface WizardResult {
  variable: ClimateVariable;
  region: WizardRegion;
  startYear: number;
  endYear: number;
}

interface DetectiveWizardProps {
  initialVariable?: ClimateVariable;
  onComplete: (result: WizardResult) => void;
  onSkip: () => void;
  /** La elección se enseña en el globo antes de confirmar. */
  onPreviewVariable?: (variable: ClimateVariable) => void;
  onPreviewRegion?: (region: WizardRegion) => void;
}

const STEPS = [
  { label: 'Variable', question: '¿Qué quieres investigar?',
    hint: 'Elige una variable del sistema Tierra. El globo cambia mientras eliges.' },
  { label: 'Lugar', question: '¿Dónde quieres mirar?',
    hint: 'Casi ninguna tendencia es global: la misma variable sube en un lugar y baja en otro.' },
  { label: 'Periodo', question: '¿Cuántos años quieres analizar?',
    hint: 'Con más años, la prueba estadística distingue mejor una tendencia real del azar.' },
] as const;
type Step = 0 | 1 | 2;

export function DetectiveWizard({ initialVariable = 'Gistemp', onComplete, onSkip, onPreviewVariable, onPreviewRegion }: DetectiveWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [variable, setVariable] = useState<ClimateVariable>(initialVariable);
  const [region, setRegion] = useState<WizardRegion>(WIZARD_REGIONS[0]);
  const [period, setPeriod] = useState<WizardPeriod>(WIZARD_PERIODS[0]);
  const [catalog, setCatalog] = useState<DatasetCatalog | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  useFocusTrap(dialogRef);

  // El catálogo dice qué variables tienen datos reales cargados y qué años cubre cada una.
  useEffect(() => {
    let active = true;
    void getDatasetCatalog().then(loaded => { if (active) setCatalog(loaded); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onSkip]);

  const selectVariable = useCallback((next: ClimateVariable) => {
    setVariable(next);
    onPreviewVariable?.(next);
  }, [onPreviewVariable]);
  const selectRegion = useCallback((next: WizardRegion) => {
    setRegion(next);
    onPreviewRegion?.(next);
  }, [onPreviewRegion]);

  const goTo = (next: Step) => {
    setDirection(next > step ? 'forward' : 'back');
    setStep(next);
    // Al llegar al paso "lugar" el globo se orienta a la región ya marcada, sin esperar un clic.
    if (next === 1) onPreviewRegion?.(region);
  };
  const handleNext = () => {
    if (step < 2) goTo((step + 1) as Step);
    else onComplete({ variable, region, startYear: period.startYear, endYear: period.endYear });
  };

  const variableName = CLIMATE_VARIABLES.find(item => item.id === variable)?.name ?? variable;
  const summary = [
    { id: 'variable', label: variableName },
    ...(step > 0 ? [{ id: 'region', label: region.label }] : []),
    ...(step > 1 ? [{ id: 'period', label: period.label }] : []),
  ];

  return (
    <div className="briefing" role="dialog" aria-modal="true" aria-labelledby={headingId} ref={dialogRef} tabIndex={-1}>
      <div className="briefing__sheet">
        <header className="briefing__header">
          <p className="briefing__eyebrow">Detective de tendencias<span>NASA Space Apps 2026</span></p>
          <ol className="briefing__rail" data-step={step} aria-label="Pasos del asistente">
            {STEPS.map((item, index) => (
              <li key={item.label} data-state={index === step ? 'current' : index < step ? 'done' : 'todo'}
                aria-current={index === step ? 'step' : undefined}>
                <span className="briefing__rail-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="briefing__rail-label">{item.label}</span>
              </li>
            ))}
          </ol>
          <h1 id={headingId} className="briefing__question">{STEPS[step].question}</h1>
          <p className="briefing__hint">{STEPS[step].hint}</p>
        </header>

        {/* La clave fuerza el montaje del paso para que la transición de entrada se repita. */}
        <div className="briefing__body scrollbar-instrument" key={step} data-direction={direction}>
          {step === 0 && <VariableStep variable={variable} catalog={catalog} onSelect={selectVariable} />}
          {step === 1 && <RegionStep region={region} variable={variable} onSelect={selectRegion} onSuggest={selectVariable} />}
          {step === 2 && <PeriodStep period={period} variable={variable} catalog={catalog} onSelect={setPeriod} />}
        </div>

        <footer className="briefing__footer">
          <p className="briefing__summary" aria-live="polite">
            {summary.map(entry => <span key={entry.id}>{entry.label}</span>)}
          </p>
          <div className="briefing__actions">
            {step === 0 ? (
              <button type="button" className="briefing__ghost focus-ring" onClick={onSkip}>Explorar sin guía</button>
            ) : (
              <button type="button" className="briefing__ghost focus-ring" onClick={() => goTo((step - 1) as Step)}>
                <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />Atrás
              </button>
            )}
            <button type="button" className="briefing__primary focus-ring" onClick={handleNext}>
              {step < 2 ? 'Continuar' : 'Abrir el expediente'}
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
