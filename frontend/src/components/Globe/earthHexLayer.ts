import type { GlobeInstance } from 'globe.gl';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import {
  getObservationValue, observationMagnitude, sampleObservationColor,
} from '../../utils/colorScales';
import { createHexColumns } from './hexColumns';

type ObservationHandler = (observation: ClimateObservation | null) => void;

/**
 * Observaciones anuales: nunca convierte valores de temperatura/NDVI/CO₂ en pendientes.
 * Mantiene una InstancedMesh/BVH en la capa pública de Globe, porque el hexbin nativo
 * crea un Mesh por celda; su modo merged pierde transiciones y selección individual.
 */
export function createEarthHexLayer(
  globe: GlobeInstance,
  onSelectLocation?: (location: { lat: number; lng: number }) => void,
) {
  let observations = new Map<string, ClimateObservation>();
  let onObservationSelect: ObservationHandler | null | undefined;
  let selected: ClimateObservation | null = null;
  let disposed = false;
  const columns = createHexColumns(globe, cell => {
    selected = cell ? observations.get(cell.id) ?? null : null;
    onObservationSelect?.(selected);
  }, {
    transitionMs: 800,
    transitionColors: true,
    color: (cell, data, target) => sampleObservationColor(data.variable, cell.slope, target),
    magnitude: (cell, data) => observationMagnitude(data.variable, cell.slope),
  });

  const inspectSelection = () => {
    if (selected) onSelectLocation?.({ lat: selected.latitude, lng: selected.longitude });
  };

  return {
    updateData(next: ClimateObservation[], variable: ClimateVariable): void {
      if (disposed) return;
      observations = new Map(next.filter(observation => observation.variable === variable
        && Number.isFinite(observation.latitude) && Math.abs(observation.latitude) <= 90
        && Number.isFinite(observation.longitude) && Math.abs(observation.longitude) <= 180
        && Number.isFinite(getObservationValue(observation)))
        .map(observation => [observation.id, observation]));
      columns.setDataset({
        variable,
        // Huella gráfica nominal, no resolución científica ni agrupación por países.
        resolutionDegrees: 2.2,
        heightDomain: 1,
        cells: Array.from(observations.values(), observation => ({
          id: observation.id, latitude: observation.latitude, longitude: observation.longitude,
          // Campo privado del renderer legado: la magnitud se calcula arriba por variable.
          slope: getObservationValue(observation),
        })),
      });
    },
    setVisible(visible: boolean): void {
      if (!disposed) columns.setVisible(visible);
    },
    setOnObservationSelect(handler?: ObservationHandler | null): void {
      onObservationSelect = handler;
    },
    select(id: string | null): void {
      if (disposed) return;
      columns.select(id);
      inspectSelection();
    },
    pick(x: number, y: number): boolean {
      if (disposed) return false;
      const hit = columns.pick(x, y);
      if (hit) inspectSelection();
      return hit;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      columns.dispose();
      observations.clear();
      selected = null;
      onObservationSelect = undefined;
    },
  };
}
