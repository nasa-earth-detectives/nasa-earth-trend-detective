/**
 * "Period" step of the briefing. Instead of three text cards, it plots the record on a year ruler:
 * what the chosen source covers and what span will be analyzed. That makes it visible, not just
 * readable, why a long series carries more weight than a short one.
 */
import type { CSSProperties } from 'react';
import type { ClimateVariable } from '../../types/climate.types';
import type { DatasetCatalog } from '../../types/dataset.types';
import { CLIMATE_VARIABLES, EARLIEST_RECORD_YEAR, SATELLITE_TIMELINE } from '../../config/climateLayers';
import { WIZARD_PERIODS, type WizardPeriod } from '../../config/wizardOptions';

/** Same minimum applied by the backend per cell (GridTrendService.MinYearsPerCell). */
const MIN_YEARS_FOR_TEST = 10;
const RULER_START = EARLIEST_RECORD_YEAR;
const RULER_END = SATELLITE_TIMELINE.endYear;
const percent = (year: number) => `${((year - RULER_START) / (RULER_END - RULER_START)) * 100}%`;

// Ruler ticks: computed once, outside render.
const TICKS = [RULER_START, 1990, 2000, 2010, 2020, RULER_END]
  .map(year => ({ year, style: { '--at': percent(year) } as CSSProperties }));

/** Span [from, to] as distances from the ruler edges. */
const span = (from: number, to: number) =>
  ({ '--from': percent(from), '--to': `calc(100% - ${percent(to)})` }) as CSSProperties;

interface PeriodStepProps {
  period: WizardPeriod; variable: ClimateVariable; catalog: DatasetCatalog | null;
  onSelect: (period: WizardPeriod) => void;
}

export function PeriodStep({ period, variable, catalog, onSelect }: PeriodStepProps) {
  const provenance = catalog?.get(variable) ?? null;
  const coverage = provenance
    ? { start: provenance.coverageStart, end: provenance.coverageEnd }
    : { start: SATELLITE_TIMELINE.startYear, end: SATELLITE_TIMELINE.endYear };
  // What actually gets analyzed is the overlap between requested years and source coverage.
  const clamp = (item: WizardPeriod) => {
    const start = Math.max(item.startYear, coverage.start);
    const end = Math.min(item.endYear, coverage.end);
    return { start, end, years: Math.max(0, end - start + 1) };
  };
  const chosen = clamp(period);
  const name = CLIMATE_VARIABLES.find(item => item.id === variable)?.name ?? variable;
  const source = provenance ? provenance.product.split('·')[0].trim() : 'demo scenario';

  return (
    <>
      <div className="briefing-readout" aria-live="polite">
        <strong>{chosen.years}</strong>
        <p><span>years of data</span>{chosen.start} — {chosen.end} · {name} ({source})</p>
      </div>

      <div className="briefing-ruler" aria-hidden="true">
        <span className="briefing-ruler__track" />
        <span className="briefing-ruler__coverage" style={span(coverage.start, coverage.end)} />
        {chosen.years > 0 && <span className="briefing-ruler__span" style={span(chosen.start, chosen.end)} />}
        {TICKS.map(tick => <span key={tick.year} className="briefing-ruler__tick" style={tick.style}>{tick.year}</span>)}
      </div>

      <div role="radiogroup" aria-label="Analysis period" className="briefing-periods">
        {WIZARD_PERIODS.map((item) => {
          const { years } = clamp(item);
          return (
            <button key={item.id} type="button" role="radio" aria-checked={period.id === item.id}
              className="briefing-period focus-ring" data-selected={period.id === item.id}
              data-short={years < MIN_YEARS_FOR_TEST} onClick={() => onSelect(item)}>
              <span className="briefing-period__label">{item.label}</span>
              <span className="briefing-period__years">{years} years</span>
            </button>
          );
        })}
      </div>

      <p className="briefing-note">
        {chosen.years < MIN_YEARS_FOR_TEST
          ? `With fewer than ${MIN_YEARS_FOR_TEST} years the Mann-Kendall test is unreliable: choose a longer period.`
          : 'The Mann-Kendall test compares every year against all others. A trend that is not '
            + 'significant is also a result: sometimes it just needs more years.'}
      </p>
    </>
  );
}
