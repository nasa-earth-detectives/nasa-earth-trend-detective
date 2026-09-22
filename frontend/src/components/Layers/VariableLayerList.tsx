import type { CSSProperties, KeyboardEvent } from 'react';
import type { ClimateVariable } from '../../types/climate.types';
import { CLIMATE_VARIABLES, UPCOMING_VARIABLES } from '../../config/climateLayers';
import { OBSERVATION_LENSES } from '../../config/observationLenses';

interface VariableLayerListProps {
  selected: ClimateVariable;
  onSelect: (variable: ClimateVariable) => void;
}

/** Filas de altura estable: el marcador recorre el índice sin medir el DOM. */
export function VariableLayerList({ selected, onSelect }: VariableLayerListProps) {
  const selectedIndex = CLIMATE_VARIABLES.findIndex((variable) => variable.id === selected);
  const moveSelection = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsets: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let next = selectedIndex;
    if (event.key in offsets) next = (selectedIndex + offsets[event.key] + CLIMATE_VARIABLES.length) % CLIMATE_VARIABLES.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = CLIMATE_VARIABLES.length - 1;
    else return;
    event.preventDefault();
    onSelect(CLIMATE_VARIABLES[next].id);
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')[next]?.focus();
  };

  return (
    <div className="variable-instrument">
      <div className="variable-index" role="radiogroup" aria-label="Variable científica principal"
        onKeyDown={moveSelection} style={{ '--variable-index': selectedIndex } as CSSProperties}>
        <span className="variable-index__marker" aria-hidden="true" />
        {CLIMATE_VARIABLES.map((variable) => (
          <button key={variable.id} type="button" role="radio" aria-checked={variable.id === selected}
            tabIndex={variable.id === selected ? 0 : -1} onClick={() => onSelect(variable.id)}
            className="variable-row focus-ring" data-band={OBSERVATION_LENSES[variable.id].band}>
            <span className="variable-row__symbol" aria-hidden="true">{OBSERVATION_LENSES[variable.id].symbol}</span>
            <span className="variable-row__text">
              <span className="variable-row__name">{variable.name}</span>
              <span className="variable-row__source" aria-hidden={variable.id !== selected}>
                {variable.satelliteMission}
                <span className="variable-row__mobile-unit"> / {variable.unit}</span>
              </span>
            </span>
            <span className="variable-row__rail" aria-hidden="true" />
          </button>
        ))}
        {UPCOMING_VARIABLES.map((variable) => (
          <button key={variable.id} type="button" role="radio" aria-checked={false} disabled
            className="variable-row variable-row--future">
            <span className="variable-row__symbol" aria-hidden="true">Δh</span>
            <span className="variable-row__name">{variable.name}</span>
            <span className="variable-row__soon">Pronto</span>
          </button>
        ))}
      </div>

      <div className="variable-readout" aria-live="polite" aria-atomic="true">
        {CLIMATE_VARIABLES.map((variable) => (
          <div key={variable.id} className="variable-readout__entry" data-active={variable.id === selected}
            aria-hidden={variable.id !== selected}>
            <p className="variable-readout__domain">{OBSERVATION_LENSES[variable.id].domain}</p>
            <p className="variable-readout__focus">{OBSERVATION_LENSES[variable.id].focus}</p>
            <p className="variable-readout__unit"><span>Magnitud</span>{variable.unit}</p>
            <p className="variable-readout__description">{variable.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
