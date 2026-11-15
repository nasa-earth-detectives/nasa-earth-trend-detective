import type { GlobeInstance } from 'globe.gl';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import type { HexDataset } from '../../types/hex.types';
import type { GlobeReading, ObservationLayerMode } from '../../types/observationLayer.types';
import { createEarthHexLayer } from './earthHexLayer';
import { createEarthHeatLayer } from './earthHeatLayer';
import { createEarthTrendLayer } from './earthTrendLayer';

/**
 * Two mutually exclusive readings (annual value · trend) and, within annual value,
 * two representations. The raster is only computed when needed.
 */
export function createEarthObservationLayers(globe: GlobeInstance,
  onSelectLocation: (location: { lat: number; lng: number }) => void, onAsyncChange?: () => void) {
  const hex = createEarthHexLayer(globe, onSelectLocation);
  const heat = createEarthHeatLayer(globe, onAsyncChange);
  const trend = createEarthTrendLayer(globe, onSelectLocation);
  let mode: ObservationLayerMode = 'hex';
  let reading: GlobeReading = 'annual';
  let observations: ClimateObservation[] = [];
  let variable: ClimateVariable = 'Gistemp';
  let heatDirty = true;
  heat.setVisible(false);
  trend.setVisible(false);

  const applyVisibility = (): void => {
    const trendActive = reading === 'trend';
    hex.setVisible(!trendActive && mode === 'hex');
    heat.setVisible(!trendActive && mode === 'heat');
    trend.setVisible(trendActive);
  };

  const updateData = (next: ClimateObservation[], nextVariable: ClimateVariable) => {
    observations = next;
    variable = nextVariable;
    heatDirty = true;
    hex.updateData(observations, variable);
    if (reading === 'annual' && mode === 'heat') { heat.updateData(observations, variable); heatDirty = false; }
  };

  const setMode = (next: ObservationLayerMode) => {
    mode = next;
    if (reading === 'annual' && mode === 'heat' && heatDirty) {
      heat.updateData(observations, variable);
      heatDirty = false;
    }
    applyVisibility();
  };

  const setReading = (next: GlobeReading) => {
    reading = next;
    applyVisibility();
  };

  return {
    updateData, setMode, setReading,
    setTrendData: (dataset: HexDataset | null) => trend.setDataset(dataset),
    setOnCellSelect: trend.setOnCellSelect,
    select: (id: string | null) => (reading === 'trend' ? trend.select(id) : hex.select(id)),
    setOnObservationSelect: hex.setOnObservationSelect,
    pick: (x: number, y: number) => reading === 'trend'
      ? trend.pick(x, y) : mode === 'hex' && hex.pick(x, y),
    dispose: () => { hex.dispose(); heat.dispose(); trend.dispose(); },
  };
}
