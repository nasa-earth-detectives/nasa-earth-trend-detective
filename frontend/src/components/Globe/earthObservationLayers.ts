import type { GlobeInstance } from 'globe.gl';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { ObservationLayerMode } from '../../types/observationLayer.types';
import { createEarthHexLayer } from './earthHexLayer';
import { createEarthHeatLayer } from './earthHeatLayer';

/** Dos representaciones excluyentes. El raster sólo se calcula cuando se necesita. */
export function createEarthObservationLayers(globe: GlobeInstance,
  onSelectLocation: (location: { lat: number; lng: number }) => void) {
  const hex = createEarthHexLayer(globe, onSelectLocation);
  const heat = createEarthHeatLayer(globe);
  let mode: ObservationLayerMode = 'hex';
  let observations: ClimateObservation[] = [];
  let variable: ClimateVariable = 'Gistemp';
  let heatDirty = true;
  heat.setVisible(false);
  const updateData = (next: ClimateObservation[], nextVariable: ClimateVariable) => {
    observations = next;
    variable = nextVariable;
    heatDirty = true;
    hex.updateData(observations, variable);
    if (mode === 'heat') { heat.updateData(observations, variable); heatDirty = false; }
  };
  const setMode = (next: ObservationLayerMode) => {
    mode = next;
    hex.setVisible(mode === 'hex');
    if (mode === 'heat' && heatDirty) { heat.updateData(observations, variable); heatDirty = false; }
    heat.setVisible(mode === 'heat');
  };
  return {
    updateData, setMode,
    select: hex.select,
    setOnObservationSelect: hex.setOnObservationSelect,
    pick: (x: number, y: number) => mode === 'hex' && hex.pick(x, y),
    dispose: () => { hex.dispose(); heat.dispose(); },
  };
}
