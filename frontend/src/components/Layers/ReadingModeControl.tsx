import type { KeyboardEvent } from 'react';
import { InstrumentSwitch } from '../UI/InstrumentSwitch';
import type { GlobeReading, ObservationCoverage, ObservationLayerMode } from '../../types/observationLayer.types';

interface RadioOption<T extends string> { id: T; label: string }

interface RadioGroupProps<T extends string> {
  label: string;
  options: readonly RadioOption<T>[];
  value: T;
  disabled?: boolean;
  onChange: (value: T) => void;
}

/** Radiogroup de una sola fila; conserva las flechas, Home y End del patrón nativo. */
function RadioGroup<T extends string>({ label, options, value, disabled = false, onChange }: RadioGroupProps<T>) {
  const index = Math.max(0, options.findIndex(option => option.id === value));
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      return;
    }
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + options.length) % options.length;
    onChange(options[next].id);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus();
  };
  return (
    <div className="observation-mode-control" role="radiogroup" aria-label={label} data-disabled={disabled}>
      {options.map(option => (
        <button key={option.id} type="button" role="radio" className="focus-ring"
          aria-checked={value === option.id} tabIndex={value === option.id ? 0 : -1}
          disabled={disabled} onClick={() => onChange(option.id)} onKeyDown={move}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

const READINGS: readonly RadioOption<GlobeReading>[] = [
  { id: 'annual', label: 'Valor del año' },
  { id: 'trend', label: 'Tendencia (Sen)' },
];

const MODES: readonly RadioOption<ObservationLayerMode>[] = [
  { id: 'hex', label: 'Hexágonos 3D' },
  { id: 'heat', label: 'Mapa de calor' },
  { id: 'none', label: 'Sin capa' },
];

interface ReadingModeControlProps {
  reading: GlobeReading;
  onReadingChange: (value: GlobeReading) => void;
  observationMode: ObservationLayerMode;
  onObservationModeChange: (value: ObservationLayerMode) => void;
  coverage: ObservationCoverage;
  onCoverageChange: (value: ObservationCoverage) => void;
  showCoverage: boolean;
}

/**
 * Dos preguntas distintas sobre el mismo planeta: el valor de un año concreto
 * y el ritmo de cambio de todo el periodo. La representación sólo aplica a la primera.
 */
export function ReadingModeControl({
  reading, onReadingChange, observationMode, onObservationModeChange,
  coverage, onCoverageChange, showCoverage,
}: ReadingModeControlProps) {
  return (
    <div className="hex-layer-control">
      <h3 className="instrument-kicker">Lectura</h3>
      <RadioGroup label="Qué pregunta responde el globo" options={READINGS}
        value={reading} onChange={onReadingChange} />
      <h3 className="instrument-kicker" style={{ marginTop: '0.85rem' }}
        title={reading === 'trend' ? 'La tendencia se dibuja siempre en columnas' : undefined}>Representación</h3>
      <RadioGroup label="Representación de observaciones" options={MODES}
        value={observationMode} disabled={reading === 'trend'} onChange={onObservationModeChange} />
      {reading === 'trend' && <p className="instrument-note">
        La tendencia usa una sola geometría de columnas; la altura es el ritmo de cambio, no el valor del año.
      </p>}
      {showCoverage && <InstrumentSwitch label="Incluir océanos" description="La vista inicial muestra tierra firme"
        checked={coverage === 'global'} onChange={enabled => onCoverageChange(enabled ? 'global' : 'land')} />}
    </div>
  );
}
