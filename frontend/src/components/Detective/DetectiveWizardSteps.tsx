/**
 * "Variable" and "Location" steps of the briefing. They do not hold selection state: the wizard
 * decides and they render it. Laid out as row lists rather than equal cards so a variable whose
 * dataset is loaded does not carry the same weight as one the API cannot serve yet.
 */
import { Crosshair } from 'lucide-react';
import type { ClimateVariable, VariableMetadata } from '../../types/climate.types';
import type { DatasetCatalog } from '../../types/dataset.types';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { WIZARD_REGIONS, type WizardRegion } from '../../config/wizardOptions';
import { formatTemplate, useI18n } from '../../i18n';
import { VARIABLE_ACCENT_STYLE, VARIABLE_ICONS } from './variableIcons';

/** Short source name ("MERRA-2", "GISTEMP v4") or why real data are missing. */
function sourceTag(
  catalog: DatasetCatalog | null,
  variable: ClimateVariable,
  noDataTag: string,
): string {
  const provenance = catalog?.get(variable);
  if (provenance) return provenance.product.split('·')[0].trim();
  // An empty catalog means the API has not answered yet: that is "checking", not "no data".
  if (!catalog || catalog.size === 0) return '';
  return noDataTag;
}

interface VariableRowProps {
  meta: VariableMetadata; selected: boolean; real: boolean; tag: string; onSelect: (variable: ClimateVariable) => void;
}

function VariableRow({ meta, selected, real, tag, onSelect }: VariableRowProps) {
  const { t } = useI18n();
  const entry = t.variableGlossary[meta.id];
  const name = t.variables[meta.id]?.name ?? meta.name;
  const Icon = VARIABLE_ICONS[meta.id];
  return (
    <div className="briefing-item" data-selected={selected} style={VARIABLE_ACCENT_STYLE[meta.id]}>
      <button type="button" role="radio" aria-checked={selected} className="briefing-row focus-ring"
        data-kind={real ? 'real' : 'other'} onClick={() => onSelect(meta.id)}>
        <span className="briefing-row__icon" aria-hidden="true"><Icon size={18} strokeWidth={1.5} /></span>
        <span className="briefing-row__text">
          <span className="briefing-row__name">{name}</span>
          <span className="briefing-row__question">{entry.tagline}</span>
        </span>
        {tag && <span className="briefing-row__tag">{tag}</span>}
      </button>
      {selected && (
        <div className="briefing-item__detail">
          <p>{entry.plain}</p>
          <dl>
            <div><dt>{t.wizard.unitLabel}</dt><dd>{entry.unit}</dd></div>
            <div><dt>{t.wizard.guidingQuestion}</dt><dd>{entry.askAbout}</dd></div>
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
  const { t } = useI18n();
  const real = CLIMATE_VARIABLES.filter(meta => catalog?.has(meta.id));
  const others = CLIMATE_VARIABLES.filter(meta => !catalog?.has(meta.id));
  const row = (meta: VariableMetadata, isReal: boolean) => (
    <VariableRow key={meta.id} meta={meta} selected={variable === meta.id} real={isReal}
      tag={sourceTag(catalog, meta.id, t.wizard.noDataTag)} onSelect={onSelect} />
  );
  return (
    <div role="radiogroup" aria-label={t.wizard.variableGroupAria}>
      {real.length > 0 && (
        <section className="briefing-group">
          <h2 className="briefing-group__title">{t.wizard.realNasaData}<span>{real.length}</span></h2>
          {real.map(meta => row(meta, true))}
        </section>
      )}
      {others.length > 0 && (
        <section className="briefing-group" data-quiet={catalog !== null && catalog.size > 0}>
          <h2 className="briefing-group__title">
            {!catalog || catalog.size === 0 ? t.wizard.checkingData : t.wizard.notLoadedGroup}<span>{others.length}</span>
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
  const { t } = useI18n();
  const compass = t.readouts.compass;
  const suggestions = region.id !== 'custom' && !region.suggestedVariables.includes(variable)
    ? region.suggestedVariables : [];
  const selectedRegionLabel = t.regions[region.id]?.label ?? region.label;
  return (
    <>
      <div role="radiogroup" aria-label={t.wizard.regionGroupAria} className="briefing-group">
        {WIZARD_REGIONS.map((item) => {
          const itemLabel = t.regions[item.id]?.label ?? item.label;
          const itemDescription = t.regions[item.id]?.description ?? item.description;
          return (
            <div key={item.id} className="briefing-item" data-selected={region.id === item.id}>
              <button type="button" role="radio" aria-checked={region.id === item.id} className="briefing-row focus-ring"
                onClick={() => onSelect(item)}>
                <span className="briefing-row__text">
                  <span className="briefing-row__name">{itemLabel}</span>
                  <span className="briefing-row__question">{itemDescription}</span>
                </span>
                {item.id === 'custom'
                  ? <span className="briefing-row__coords" aria-hidden="true"><Crosshair size={15} strokeWidth={1.5} /></span>
                  : <span className="briefing-row__coords">{coordinate(item.lat, compass.north, compass.south)}<br />{coordinate(item.lng, compass.east, compass.west)}</span>}
              </button>
            </div>
          );
        })}
      </div>

      {region.id === 'custom' && (
        <p className="briefing-note">{t.wizard.customGlobeNote}</p>
      )}
      {suggestions.length > 0 && (
        <div className="briefing-note">
          <p>{formatTemplate(t.wizard.regionSuggestIntro, { region: selectedRegionLabel })}</p>
          <div className="briefing-note__chips">
            {suggestions.map(id => (
              <button key={id} type="button" className="briefing-chip focus-ring" style={VARIABLE_ACCENT_STYLE[id]}
                onClick={() => onSuggest(id)}>
                {formatTemplate(t.wizard.switchToVariable, { variable: t.variables[id]?.name ?? id })}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
