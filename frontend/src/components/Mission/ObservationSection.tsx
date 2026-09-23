import type { ClimateVariable } from '../../types/climate.types';
import { OBSERVATION_LENSES } from '../../config/observationLenses';

/** Esquema de los ámbitos terrestres, sin escala ni valores de medición. */
export function ObservationSection({ variable }: { variable: ClimateVariable }) {
  const { band } = OBSERVATION_LENSES[variable];
  return (
    <svg className="observation-section" viewBox="0 0 232 70" fill="none" data-band={band}
      aria-hidden="true">
      <path className="section-ground" d="M2 35h23l18-12 19 12 28-5 26 7h114v30H2Z" />
      <path className="section-soil" d="M2 47h23l18-10 19 10 28-5 26 7h114M2 57h26l15-8 19 8h168" />
      <path className="section-water" d="M131 40h22m7 0h22m7 0h23M119 47h22m7 0h22m7 0h22m-68 8h22m7 0h22m7 0h23" />
      <path className="section-surface" d="M2 35h23l18-12 19 12 28-5 26 7h114" />
      <path className="section-vegetation" d="M72 33V19m0 7-7-6m7 3 7-6M92 30V14m0 9-7-7m7 3 6-6M106 34V24m0 6 6-6" />
      <path className="section-atmosphere" d="M150 4v23m-5-5 5 5 5-5M176 4v23m-5-5 5 5 5-5M202 4v23m-5-5 5 5 5-5" />
    </svg>
  );
}
