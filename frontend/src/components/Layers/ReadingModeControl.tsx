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

/** Single-row radio group; preserves native pattern Arrow, Home, and End keys. */
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
  { id: 'annual', label: 'Annual value' },
  { id: 'trend', label: 'Trend (Sen)' },
];

const MODES: readonly RadioOption<ObservationLayerMode>[] = [
  { id: 'hex', label: '3D Hexagons' },
  { id: 'heat', label: 'Heatmap' },
  { id: 'none', label: 'No layer' },
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
 * Two distinct questions about the same planet: the value in a specific year
 * versus the rate of change across the entire period. Representation only applies to the former.
 */
export function ReadingModeControl({
  reading, onReadingChange, observationMode, onObservationModeChange,
  coverage, onCoverageChange, showCoverage,
}: ReadingModeControlProps) {
  return (
    <div className="hex-layer-control">
      <h3 className="instrument-kicker">Reading</h3>
      <RadioGroup label="What question the globe answers" options={READINGS}
        value={reading} onChange={onReadingChange} />
      <h3 className="instrument-kicker" style={{ marginTop: '0.85rem' }}
        title={reading === 'trend' ? 'Trend is always drawn as columns' : undefined}>Representation</h3>
      <RadioGroup label="Observation representation" options={MODES}
        value={observationMode} disabled={reading === 'trend'} onChange={onObservationModeChange} />
      {reading === 'trend' && <p className="instrument-note">
        Trend mode uses a single column geometry; height represents rate of change, not the annual value.
      </p>}
      {showCoverage && <InstrumentSwitch label="Include oceans" description="Initial view shows land only"
        checked={coverage === 'global'} onChange={enabled => onCoverageChange(enabled ? 'global' : 'land')} />}
    </div>
  );
}
