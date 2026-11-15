import type { KeyboardEvent } from 'react';
import { InstrumentSwitch } from '../UI/InstrumentSwitch';
import type { GlobeReading, ObservationCoverage, ObservationLayerMode } from '../../types/observationLayer.types';
import { useI18n } from '../../i18n';

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

interface ReadingModeControlProps {
  reading: GlobeReading;
  onReadingChange: (value: GlobeReading) => void;
  observationMode: ObservationLayerMode;
  onObservationModeChange: (value: ObservationLayerMode) => void;
  coverage: ObservationCoverage;
  onCoverageChange: (value: ObservationCoverage) => void;
  showCoverage: boolean;
}

export function ReadingModeControl({
  reading, onReadingChange, observationMode, onObservationModeChange,
  coverage, onCoverageChange, showCoverage,
}: ReadingModeControlProps) {
  const { t } = useI18n();
  const readings: readonly RadioOption<GlobeReading>[] = [
    { id: 'annual', label: t.layers.readingAnnual },
    { id: 'trend', label: t.layers.readingTrend },
  ];
  const modes: readonly RadioOption<ObservationLayerMode>[] = [
    { id: 'hex', label: t.layers.repHex },
    { id: 'heat', label: t.layers.repHeat },
    { id: 'none', label: t.layers.repNone },
  ];
  return (
    <div className="hex-layer-control">
      <h3 className="instrument-kicker">{t.layers.readingHeading}</h3>
      <RadioGroup label={t.layers.readingAria} options={readings}
        value={reading} onChange={onReadingChange} />
      <h3 className="instrument-kicker" style={{ marginTop: '0.85rem' }}
        title={reading === 'trend' ? t.layers.repTitleDisabled : undefined}>{t.layers.repHeading}</h3>
      <RadioGroup label={t.layers.repAria} options={modes}
        value={observationMode} disabled={reading === 'trend'} onChange={onObservationModeChange} />
      {reading === 'trend' && <p className="instrument-note">{t.layers.trendNote}</p>}
      {showCoverage && <InstrumentSwitch label={t.layers.oceansLabel} description={t.layers.oceansDesc}
        checked={coverage === 'global'} onChange={enabled => onCoverageChange(enabled ? 'global' : 'land')} />}
    </div>
  );
}
