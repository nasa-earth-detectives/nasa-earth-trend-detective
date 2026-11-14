/**
 * DetectiveWizard.tsx
 *
 * "Trend Detective" welcome wizard modal.
 * Guides the user through 3 simple steps:
 *   1. What do you want to study? (variable)
 *   2. In which region of the world?
 *   3. In what time period?
 *
 * Upon completion, fires onComplete with the selection ready to
 * configure the globe directly.
 *
 * Target audience: secondary school students and general public
 * (NASA Space Apps 2026 — "Be An Earth System Trend Detective!").
 */

import { useEffect, useId, useRef, useState } from 'react';
import type { ClimateVariable } from '../../types/climate.types';
import { CLIMATE_VARIABLES, SATELLITE_TIMELINE } from '../../config/climateLayers';
import {
  VARIABLE_GLOSSARY,
  WIZARD_REGIONS,
  WIZARD_PERIODS,
  type WizardRegion,
  type WizardPeriod,
} from '../../config/glossary';
import '../../styles/detective-wizard.css';

export interface WizardResult {
  variable: ClimateVariable;
  region: WizardRegion;
  startYear: number;
  endYear: number;
}

interface DetectiveWizardProps {
  onComplete: (result: WizardResult) => void;
  onSkip: () => void;
}

const STEPS = ['Variable', 'Region', 'Period'] as const;
type Step = 0 | 1 | 2;

export function DetectiveWizard({ onComplete, onSkip }: DetectiveWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [variable, setVariable] = useState<ClimateVariable>('Gistemp');
  const [region, setRegion] = useState<WizardRegion>(WIZARD_REGIONS[0]);
  const [period, setPeriod] = useState<WizardPeriod>(WIZARD_PERIODS[0]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  // Initial focus on mount (accessibility)
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Escape key → skip
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onSkip(); }
    };
    window.addEventListener('keydown', handleKey, { capture: true });
    return () => window.removeEventListener('keydown', handleKey, { capture: true });
  }, [onSkip]);

  const currentEntry = VARIABLE_GLOSSARY[variable];

  const handleNext = () => {
    if (step < 2) {
      setStep((s) => (s + 1) as Step);
      return;
    }
    // Step 3 completed → emit result
    onComplete({ variable, region, startYear: period.startYear, endYear: period.endYear });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-labelledby={headingId}
      ref={dialogRef} tabIndex={-1}>
      <div className="wizard-panel">

        {/* Header */}
        <header className="wizard-header">
          <span className="wizard-badge">
            <span aria-hidden="true">🔍</span>
            NASA Space Apps 2026
          </span>
          <h1 id={headingId} className="wizard-title">Trend Detective</h1>
          <p className="wizard-subtitle">
            Choose what to investigate and the system will analyze whether there is a statistically
            significant change in NASA data.
          </p>
        </header>

        {/* Step indicator */}
        <div className="wizard-steps" role="list" aria-label="Wizard steps">
          {STEPS.map((label, i) => (
            <span key={label} role="listitem">
              <span
                className="wizard-step-dot"
                data-active={i === step}
                data-done={i < step}
                aria-current={i === step ? 'step' : undefined}
                title={label}
              />
            </span>
          ))}
          <span className="wizard-step-label">Step {step + 1} of {STEPS.length} — {STEPS[step]}</span>
        </div>

        {/* ── Step 1: Variable ── */}
        {step === 0 && (
          <section className="wizard-body">
            <p className="wizard-step-title">What do you want to study?</p>
            <div className="wizard-variables" role="radiogroup" aria-label="Scientific variable">
              {CLIMATE_VARIABLES.map((meta) => {
                const entry = VARIABLE_GLOSSARY[meta.id];
                return (
                  <button
                    key={meta.id}
                    type="button"
                    role="radio"
                    aria-checked={variable === meta.id}
                    className="wizard-var-card"
                    data-selected={variable === meta.id}
                    onClick={() => setVariable(meta.id)}
                  >
                    <span className="wizard-var-emoji" aria-hidden="true">{entry.emoji}</span>
                    <span className="wizard-var-name">{meta.name}</span>
                    <span className="wizard-var-tagline">{entry.tagline}</span>
                  </button>
                );
              })}
            </div>

            {/* Expanded description of selected variable */}
            <div className="wizard-var-detail" aria-live="polite" aria-atomic="true">
              <p><strong>{currentEntry.emoji} {currentEntry.tagline}</strong></p>
              <p>{currentEntry.plain}</p>
              <p>💡 <em>{currentEntry.askAbout}</em></p>
              <p>Unit: {currentEntry.unit}</p>
            </div>
          </section>
        )}

        {/* ── Step 2: Region ── */}
        {step === 1 && (
          <section className="wizard-body">
            <p className="wizard-step-title">Which region of the world?</p>
            <div className="wizard-regions" role="radiogroup" aria-label="Study region">
              {WIZARD_REGIONS.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={region.id === r.id}
                  className="wizard-region-card"
                  data-selected={region.id === r.id}
                  onClick={() => setRegion(r)}
                >
                  <span className="wizard-region-label">{r.label}</span>
                  <span className="wizard-region-desc">{r.description}</span>
                </button>
              ))}
            </div>

            {/* Note: if "custom" is selected, explains how to click */}
            {region.id === 'custom' && (
              <p className="wizard-science-note">
                <strong>💡 Free mode:</strong> Once on the globe, you can tap any point on Earth
                to select the region you want to investigate.
              </p>
            )}

            {/* Suggested variable for the region */}
            {region.id !== 'custom' && !region.suggestedVariables.includes(variable) && (
              <p className="wizard-science-note">
                <strong>Tip:</strong> For {region.label}, the most informative variable
                is usually{' '}
                {region.suggestedVariables.map((v) =>
                  CLIMATE_VARIABLES.find((m) => m.id === v)?.name
                ).join(' or ')}.
                You can switch it in the Variables panel if you prefer.
              </p>
            )}
          </section>
        )}

        {/* ── Step 3: Period ── */}
        {step === 2 && (
          <section className="wizard-body">
            <p className="wizard-step-title">How many years of data to analyze?</p>
            <div className="wizard-periods" role="radiogroup" aria-label="Analysis period">
              {WIZARD_PERIODS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={period.id === p.id}
                  className="wizard-period-card"
                  data-selected={period.id === p.id}
                  onClick={() => setPeriod(p)}
                >
                  <span className="wizard-period-years">{p.label}</span>
                  <span className="wizard-period-desc">{p.description}</span>
                </button>
              ))}
            </div>

            <p className="wizard-science-note">
              <strong>Why does the period matter?</strong>{' '}
              The Mann-Kendall statistical test needs enough data points to
              distinguish a real trend from random noise. The longer the period,
              the more reliable the result. Available data spans from{' '}
              {SATELLITE_TIMELINE.startYear} to today.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="wizard-footer">
          {step === 0 ? (
            <button type="button" className="wizard-btn-skip" onClick={onSkip}>
              Skip and explore freely
            </button>
          ) : (
            <button type="button" className="wizard-btn-back" onClick={handleBack}>
              ← Back
            </button>
          )}
          <button
            type="button"
            className="wizard-btn-next focus-ring"
            onClick={handleNext}
          >
            {step < 2 ? 'Next →' : '🔍 Start investigation'}
          </button>
        </footer>

      </div>
    </div>
  );
}
