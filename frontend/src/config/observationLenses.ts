import type { ClimateVariable } from '../types/climate.types';

/** Presentation language; does not add data or alter scientific contracts. */
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
  Merra2Temperature: { symbol: 'T2M', domain: 'Lower atmosphere', medium: 'Air at 2 m height',
    focus: 'Air temperature anomaly', band: 'atmosphere' },
  Merra2Precipitation: { symbol: 'P', domain: 'Water cycle', medium: 'Rain and snow',
    focus: 'Precipitation anomaly', band: 'water' },
  GpmPrecipitation: { symbol: 'GPM', domain: 'Water cycle', medium: 'Satellite rain and snow',
    focus: 'Precipitation anomaly', band: 'atmosphere' },
  Merra2Evaporation: { symbol: 'E', domain: 'Water cycle', medium: 'Soil and vegetation',
    focus: 'Evaporation anomaly', band: 'water' },
  Merra2SoilMoisture: { symbol: 'θ', domain: 'Soil', medium: 'Root zone',
    focus: 'Soil moisture anomaly', band: 'water' },
};
