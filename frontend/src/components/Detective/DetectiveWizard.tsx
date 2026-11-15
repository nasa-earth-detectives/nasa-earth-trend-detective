/**
 * DetectiveWizard.tsx
 *
 * "Trend Detective" startup briefing: three questions (what, where, how many years) matching
 * the NASA Space Apps 2026 challenge "Be An Earth System Trend Detective!".
 *
 * Docked to one side rather than a centered modal: the globe is the main piece of the instrument
 * and must stay in view. Each choice updates it immediately (variable and location).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { DatasetCatalog } from '../../types/dataset.types';
import { WIZARD_REGIONS, WIZARD_PERIODS, type WizardRegion, type WizardPeriod } from '../../config/wizardOptions';
import { getDatasetCatalog } from '../../services/datasetCatalog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { RegionStep, VariableStep } from './DetectiveWizardSteps';
import { PeriodStep } from './DetectiveWizardPeriod';
import { useI18n } from '../../i18n';
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
  /** Choice is shown on the globe before confirming. */
  onPreviewVariable?: (variable: ClimateVariable) => void;
  onPreviewRegion?: (region: WizardRegion) => void;
}

const STEP_IDS = ['variable', 'region', 'period'] as const;
type Step = 0 | 1 | 2;

export function DetectiveWizard({ initialVariable = 'Gistemp', onComplete, onSkip, onPreviewVariable, onPreviewRegion }: DetectiveWizardProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [variable, setVariable] = useState<ClimateVariable>(initialVariable);
  const [region, setRegion] = useState<WizardRegion>(WIZARD_REGIONS[0]);
  const [period, setPeriod] = useState<WizardPeriod>(WIZARD_PERIODS[0]);
  const [catalog, setCatalog] = useState<DatasetCatalog | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  useFocusTrap(dialogRef);

  // The catalog reports which variables have real loaded data and which years each covers.
  useEffect(() => {
    let active = true;
    // The API may still be waking up or loading datasets: keep asking while the briefing is open, so the
    // list does not stay on "no data" for something that arrives a few seconds later. Once the catalog is
    // complete the service answers from memory, with the same object, and nothing re-renders.
    const load = () => void getDatasetCatalog().then(loaded => { if (active) setCatalog(loaded); });
    load();
    const timer = window.setInterval(load, 4000);
    return () => { active = false; window.clearInterval(timer); };
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
    // When arriving at the "location" step, the globe turns to the selected region without waiting for a click.
    if (next === 1) onPreviewRegion?.(region);
  };
  const handleNext = () => {
    if (step < 2) goTo((step + 1) as Step);
    else onComplete({ variable, region, startYear: period.startYear, endYear: period.endYear });
  };

  const steps = [
    { id: STEP_IDS[0], label: t.wizard.stepVariable, question: t.wizard.stepVariableQuestion, hint: t.wizard.stepVariableHint },
    { id: STEP_IDS[1], label: t.wizard.stepLocation, question: t.wizard.stepLocationQuestion, hint: t.wizard.stepLocationHint },
    { id: STEP_IDS[2], label: t.wizard.stepPeriod, question: t.wizard.stepPeriodQuestion, hint: t.wizard.stepPeriodHint },
  ];
  const variableName = t.variables[variable]?.name ?? variable;
  const regionLabel = t.regions[region.id]?.label ?? region.label;
  const periodLabel = t.periods[period.id]?.label ?? period.label;
  const summary = [
    { id: 'variable', label: variableName },
    ...(step > 0 ? [{ id: 'region', label: regionLabel }] : []),
    ...(step > 1 ? [{ id: 'period', label: periodLabel }] : []),
  ];

  return (
    <div className="briefing" role="dialog" aria-modal="true" aria-labelledby={headingId} ref={dialogRef} tabIndex={-1}>
      <div className="briefing__sheet">
        <header className="briefing__header">
          <p className="briefing__eyebrow">{t.wizard.brand}<span>{t.wizard.eventBadge}</span></p>
          <ol className="briefing__rail" data-step={step} aria-label={t.wizard.stepsAria}>
            {steps.map((item, index) => (
              <li key={item.id} data-state={index === step ? 'current' : index < step ? 'done' : 'todo'}
                aria-current={index === step ? 'step' : undefined}>
                <span className="briefing__rail-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="briefing__rail-label">{item.label}</span>
              </li>
            ))}
          </ol>
          <h1 id={headingId} className="briefing__question">{steps[step].question}</h1>
          <p className="briefing__hint">{steps[step].hint}</p>
        </header>

        {/* Key forces step remount so the entrance transition replays. */}
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
              <button type="button" className="briefing__ghost focus-ring" onClick={onSkip}>{t.wizard.exploreWithoutGuide}</button>
            ) : (
              <button type="button" className="briefing__ghost focus-ring" onClick={() => goTo((step - 1) as Step)}>
                <ArrowLeft size={15} strokeWidth={1.7} aria-hidden="true" />{t.wizard.back}
              </button>
            )}
            <button type="button" className="briefing__primary focus-ring" onClick={handleNext}>
              {step < 2 ? t.wizard.continue : t.wizard.openDossier}
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
