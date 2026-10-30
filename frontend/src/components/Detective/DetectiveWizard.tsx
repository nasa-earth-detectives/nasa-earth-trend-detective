/**
 * DetectiveWizard.tsx
 *
 * Modal de bienvenida "Detective de Tendencias".
 * Guía al usuario en 3 pasos simples:
 *   1. ¿Qué quieres estudiar? (variable)
 *   2. ¿En qué región del mundo?
 *   3. ¿En qué período?
 *
 * Al finalizar emite onComplete con la selección lista para
 * configurar el globo directamente.
 *
 * Audiencia objetivo: estudiantes de secundaria y público general
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

const STEPS = ['Variable', 'Región', 'Período'] as const;
type Step = 0 | 1 | 2;

export function DetectiveWizard({ onComplete, onSkip }: DetectiveWizardProps) {
  const [step, setStep] = useState<Step>(0);
  const [variable, setVariable] = useState<ClimateVariable>('Gistemp');
  const [region, setRegion] = useState<WizardRegion>(WIZARD_REGIONS[0]);
  const [period, setPeriod] = useState<WizardPeriod>(WIZARD_PERIODS[0]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  // Foco inicial al montar (accesibilidad)
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Tecla Escape → saltar
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
    // Paso 3 completado → emitir resultado
    onComplete({ variable, region, startYear: period.startYear, endYear: period.endYear });
  };

  const handleBack = () => {
    if (step > 0) setStep((s) => (s - 1) as Step);
  };

  return (
    <div className="wizard-overlay" role="dialog" aria-modal="true" aria-labelledby={headingId}
      ref={dialogRef} tabIndex={-1}>
      <div className="wizard-panel">

        {/* Cabecera */}
        <header className="wizard-header">
          <span className="wizard-badge">
            <span aria-hidden="true">🔍</span>
            NASA Space Apps 2026
          </span>
          <h1 id={headingId} className="wizard-title">Detective de Tendencias</h1>
          <p className="wizard-subtitle">
            Elige qué investigar y el sistema analizará si hay un cambio estadísticamente
            significativo en los datos de la NASA.
          </p>
        </header>

        {/* Indicador de pasos */}
        <div className="wizard-steps" role="list" aria-label="Pasos del asistente">
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
          <span className="wizard-step-label">Paso {step + 1} de {STEPS.length} — {STEPS[step]}</span>
        </div>

        {/* ── Paso 1: Variable ── */}
        {step === 0 && (
          <section className="wizard-body">
            <p className="wizard-step-title">¿Qué quieres estudiar?</p>
            <div className="wizard-variables" role="radiogroup" aria-label="Variable científica">
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

            {/* Descripción expandida de la variable seleccionada */}
            <div className="wizard-var-detail" aria-live="polite" aria-atomic="true">
              <p><strong>{currentEntry.emoji} {currentEntry.tagline}</strong></p>
              <p>{currentEntry.plain}</p>
              <p>💡 <em>{currentEntry.askAbout}</em></p>
              <p>Unidad: {currentEntry.unit}</p>
            </div>
          </section>
        )}

        {/* ── Paso 2: Región ── */}
        {step === 1 && (
          <section className="wizard-body">
            <p className="wizard-step-title">¿En qué región del mundo?</p>
            <div className="wizard-regions" role="radiogroup" aria-label="Región de estudio">
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

            {/* Nota: si elige "custom" se le indica cómo hacer clic */}
            {region.id === 'custom' && (
              <p className="wizard-science-note">
                <strong>💡 Modo libre:</strong> Al entrar al globo podrás tocar cualquier punto
                de la Tierra para seleccionar la región que quieras investigar.
              </p>
            )}

            {/* Sugerencia de variable para la región */}
            {region.id !== 'custom' && !region.suggestedVariables.includes(variable) && (
              <p className="wizard-science-note">
                <strong>Sugerencia:</strong> Para {region.label}, la variable más informativa
                suele ser{' '}
                {region.suggestedVariables.map((v) =>
                  CLIMATE_VARIABLES.find((m) => m.id === v)?.name
                ).join(' o ')}.
                Puedes cambiarla en el siguiente paso si lo prefieres.
              </p>
            )}
          </section>
        )}

        {/* ── Paso 3: Período ── */}
        {step === 2 && (
          <section className="wizard-body">
            <p className="wizard-step-title">¿Cuántos años de datos analizar?</p>
            <div className="wizard-periods" role="radiogroup" aria-label="Período de análisis">
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
              <strong>¿Por qué importa el período?</strong>{' '}
              El test estadístico de Mann-Kendall necesita suficientes puntos de datos para
              distinguir una tendencia real del ruido aleatorio. Cuanto más largo el período,
              más confiable es el resultado. Los datos disponibles van desde{' '}
              {SATELLITE_TIMELINE.startYear} hasta hoy.
            </p>
          </section>
        )}

        {/* Footer */}
        <footer className="wizard-footer">
          {step === 0 ? (
            <button type="button" className="wizard-btn-skip" onClick={onSkip}>
              Saltar y explorar libremente
            </button>
          ) : (
            <button type="button" className="wizard-btn-back" onClick={handleBack}>
              ← Atrás
            </button>
          )}
          <button
            type="button"
            className="wizard-btn-next focus-ring"
            onClick={handleNext}
          >
            {step < 2 ? 'Siguiente →' : '🔍 Iniciar investigación'}
          </button>
        </footer>

      </div>
    </div>
  );
}
