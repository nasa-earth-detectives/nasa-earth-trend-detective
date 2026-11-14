import type { ClimateVariable } from '../types/climate.types';

/** Presentation layer language; adds no data and does not modify scientific contracts. */
interface ObservationLens {
  symbol: string;
  domain: string;
  medium: string;
  focus: string;
  band: 'surface' | 'biosphere' | 'water' | 'atmosphere';
}

export const OBSERVATION_LENSES: Record<ClimateVariable, ObservationLens> = {
  Gistemp: { symbol: 'T°', domain: 'Land + ocean', medium: 'Surface temperature',
    focus: 'Thermal anomaly', band: 'surface' },
  ModisNdvi: { symbol: 'NDVI', domain: 'Biosphere', medium: 'Vegetation',
    focus: 'Photosynthetic activity', band: 'biosphere' },
  GraceMass: { symbol: 'H₂O', domain: 'Water + ice', medium: 'Water reserves',
    focus: 'Mass variation', band: 'water' },
  Oco2: { symbol: 'XCO₂', domain: 'Atmosphere', medium: 'Atmospheric column',
    focus: 'CO₂ concentration', band: 'atmosphere' },
};
