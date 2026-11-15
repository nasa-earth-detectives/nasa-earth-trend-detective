import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import type { ClimateVariable } from '../../types/climate.types';
import { OBSERVATION_LENSES } from '../../config/observationLenses';
import { useI18n } from '../../i18n';
import { ObservationSection } from './ObservationSection';

export function ObservationContext({ variable }: { variable: ClimateVariable }) {
  const { t } = useI18n();
  const metadata = CLIMATE_VARIABLES.find(item => item.id === variable)!;
  const lens = OBSERVATION_LENSES[variable];
  const lensCopy = t.lenses[variable];
  const varCopy = t.variables[variable];
  return (
    <section id="tour-observation-context" className="observation-context" aria-label={t.context.ariaLabel}>
      <p className="context-kicker">{t.context.kicker} <span>{t.context.activeBadge}</span></p>
      <div className="context-crossfade" key={variable}>
        <div className="context-measure"><span className="context-symbol" aria-hidden="true">{lens.symbol}</span>
          <div><p className="context-domain">{lensCopy.domain}</p><h2>{lensCopy.focus}</h2></div></div>
        <div className="context-section"><ObservationSection variable={variable} />
          <span>{t.context.diagramCaption}</span></div>
        <dl className="context-reference">
          <div><dt>{t.context.variableLabel}</dt><dd>{varCopy.name}</dd></div>
          <div><dt>{t.context.sourceLabel}</dt><dd className="context-source">{metadata.satelliteMission}</dd></div>
          <div><dt>{t.context.unitLabel}</dt><dd className="context-unit">{varCopy.unit}</dd></div>
        </dl>
      </div>
    </section>
  );
}
