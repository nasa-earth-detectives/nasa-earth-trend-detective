/**
 * Pasos "variable" y "lugar" del expediente. No guardan la selección: el asistente decide y ellos la
 * pintan. Van como listas con filas, no como rejilla de tarjetas iguales: así una variable con datos
 * reales de la NASA no pesa lo mismo que un escenario de demostración.
 */
import { Crosshair } from 'lucide-react';
import type { ClimateVariable, VariableMetadata } from '../../types/climate.types';
import type { DatasetCatalog } from '../../types/dataset.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { VARIABLE_GLOSSARY } from '../../config/glossary';
import { WIZARD_REGIONS, type WizardRegion } from '../../config/wizardOptions';
import { hasDemoScenario } from '../../services/demo/demoScenario';
import { VARIABLE_ACCENT_STYLE, VARIABLE_ICONS } from './variableIcons';

/** Nombre corto de la fuente ("MERRA-2", "GISTEMP v4") o por qué no hay datos reales. */
function sourceTag(catalog: DatasetCatalog | null, variable: ClimateVariable): string {
  const provenance = catalog?.get(variable);
  if (provenance) return provenance.product.split('·')[0].trim();
  if (!catalog) return '';
  return hasDemoScenario(variable) ? 'Demostración' : 'Sin datos';
}

interface VariableRowProps {
  meta: VariableMetadata; selected: boolean; real: boolean; tag: string; onSelect: (variable: ClimateVariable) => void;
}

function VariableRow({ meta, selected, real, tag, onSelect }: VariableRowProps) {
  const entry = VARIABLE_GLOSSARY[meta.id];
  const Icon = VARIABLE_ICONS[meta.id];
  return (
    <div className="briefing-item" data-selected={selected} style={VARIABLE_ACCENT_STYLE[meta.id]}>
      <button type="button" role="radio" aria-checked={selected} className="briefing-row focus-ring"
        data-kind={real ? 'real' : 'other'} onClick={() => onSelect(meta.id)}>
        <span className="briefing-row__icon" aria-hidden="true"><Icon size={18} strokeWidth={1.5} /></span>
        <span className="briefing-row__text">
          <span className="briefing-row__name">{meta.name}</span>
          <span className="briefing-row__question">{entry.tagline}</span>
        </span>
        {tag && <span className="briefing-row__tag">{tag}</span>}
      </button>
      {selected && (
        <div className="briefing-item__detail">
          <p>{entry.plain}</p>
          <dl>
            <div><dt>Unidad</dt><dd>{entry.unit}</dd></div>
            <div><dt>Pregunta guía</dt><dd>{entry.askAbout}</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}

interface VariableStepProps {
  variable: ClimateVariable; catalog: DatasetCatalog | null; onSelect: (variable: ClimateVariable) => void;
}

export function VariableStep({ variable, catalog, onSelect }: VariableStepProps) {
  const real = CLIMATE_VARIABLES.filter(meta => catalog?.has(meta.id));
  const others = CLIMATE_VARIABLES.filter(meta => !catalog?.has(meta.id));
  const row = (meta: VariableMetadata, isReal: boolean) => (
    <VariableRow key={meta.id} meta={meta} selected={variable === meta.id} real={isReal}
      tag={sourceTag(catalog, meta.id)} onSelect={onSelect} />
  );
  return (
    <div role="radiogroup" aria-label="Variable científica">
      {real.length > 0 && (
        <section className="briefing-group">
          <h2 className="briefing-group__title">Datos reales de la NASA<span>{real.length}</span></h2>
          {real.map(meta => row(meta, true))}
        </section>
      )}
      {others.length > 0 && (
        <section className="briefing-group" data-quiet={catalog !== null}>
          <h2 className="briefing-group__title">
            {!catalog ? 'Comprobando qué datos hay…' : 'Sin datos reales · sólo demostración'}<span>{others.length}</span>
          </h2>
          {others.map(meta => row(meta, false))}
        </section>
      )}
    </div>
  );
}

const coordinate = (value: number, positive: string, negative: string) =>
  `${Math.abs(value)}° ${value >= 0 ? positive : negative}`;

interface RegionStepProps {
  region: WizardRegion; variable: ClimateVariable;
  onSelect: (region: WizardRegion) => void; onSuggest: (variable: ClimateVariable) => void;
}

export function RegionStep({ region, variable, onSelect, onSuggest }: RegionStepProps) {
  const suggestions = region.id !== 'custom' && !region.suggestedVariables.includes(variable)
    ? region.suggestedVariables : [];
  return (
    <>
      <div role="radiogroup" aria-label="Región de estudio" className="briefing-group">
        {WIZARD_REGIONS.map((item) => (
          <div key={item.id} className="briefing-item" data-selected={region.id === item.id}>
            <button type="button" role="radio" aria-checked={region.id === item.id} className="briefing-row focus-ring"
              onClick={() => onSelect(item)}>
              <span className="briefing-row__text">
                <span className="briefing-row__name">{item.label}</span>
                <span className="briefing-row__question">{item.description}</span>
              </span>
              {item.id === 'custom'
                ? <span className="briefing-row__coords" aria-hidden="true"><Crosshair size={15} strokeWidth={1.5} /></span>
                : <span className="briefing-row__coords">{coordinate(item.lat, 'N', 'S')}<br />{coordinate(item.lng, 'E', 'O')}</span>}
            </button>
          </div>
        ))}
      </div>

      {region.id === 'custom' && (
        <p className="briefing-note">Al abrir el expediente podrás tocar cualquier punto del globo para investigarlo.</p>
      )}
      {suggestions.length > 0 && (
        <div className="briefing-note">
          <p>En {region.label} suele decir más otra variable:</p>
          <div className="briefing-note__chips">
            {suggestions.map(id => (
              <button key={id} type="button" className="briefing-chip focus-ring" style={VARIABLE_ACCENT_STYLE[id]}
                onClick={() => onSuggest(id)}>
                Cambiar a {CLIMATE_VARIABLES.find(meta => meta.id === id)?.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
