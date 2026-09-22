import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import type { ClimateVariable } from '../../types/climate.types';
import { OBSERVATION_LENSES } from '../../config/observationLenses';
import { ObservationSection } from './ObservationSection';

export function ObservationContext({ variable }: { variable: ClimateVariable }) {
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable)!;
  const lens = OBSERVATION_LENSES[variable];
  return (
    <section id="tour-observation-context" className="observation-context" aria-label="Observación actual">
      <p className="context-kicker">Perspectiva terrestre <span>activa</span></p>
      <div className="context-crossfade" key={variable}>
        <div className="context-measure"><span className="context-symbol" aria-hidden="true">{lens.symbol}</span>
          <div><p className="context-domain">{lens.domain}</p><h2>{lens.focus}</h2></div></div>
        <div className="context-section"><ObservationSection variable={variable} />
          <span>Ámbito de observación · esquema</span></div>
        <dl className="context-reference">
          <div><dt>Variable</dt><dd>{metadata.name}</dd></div>
          <div><dt>Fuente</dt><dd className="context-source">{metadata.satelliteMission}</dd></div>
          <div><dt>Unidad</dt><dd className="context-unit">{metadata.unit}</dd></div>
        </dl>
      </div>
    </section>
  );
}
