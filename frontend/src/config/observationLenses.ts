import type { ClimateVariable } from '../types/climate.types';

/** Lenguaje de presentación; no añade datos ni modifica los contratos científicos. */
interface ObservationLens {
  symbol: string;
  domain: string;
  medium: string;
  focus: string;
  band: 'surface' | 'biosphere' | 'water' | 'atmosphere';
}

export const OBSERVATION_LENSES: Record<ClimateVariable, ObservationLens> = {
  Gistemp: { symbol: 'T°', domain: 'Tierra + océano', medium: 'Temperatura superficial',
    focus: 'Anomalía térmica', band: 'surface' },
  ModisNdvi: { symbol: 'NDVI', domain: 'Biosfera', medium: 'Vegetación',
    focus: 'Actividad fotosintética', band: 'biosphere' },
  GraceMass: { symbol: 'H₂O', domain: 'Agua + hielo', medium: 'Reservas de agua',
    focus: 'Variación de masa', band: 'water' },
  Oco2: { symbol: 'XCO₂', domain: 'Atmósfera', medium: 'Columna atmosférica',
    focus: 'Concentración de CO₂', band: 'atmosphere' },
  Merra2Temperature: { symbol: 'T2M', domain: 'Atmósfera baja', medium: 'Aire a 2 m del suelo',
    focus: 'Anomalía de temperatura del aire', band: 'atmosphere' },
  Merra2Precipitation: { symbol: 'P', domain: 'Ciclo del agua', medium: 'Lluvia y nieve',
    focus: 'Anomalía de precipitación', band: 'water' },
  GpmPrecipitation: { symbol: 'GPM', domain: 'Ciclo del agua', medium: 'Lluvia y nieve desde satélite',
    focus: 'Anomalía de precipitación', band: 'atmosphere' },
  Merra2Evaporation: { symbol: 'E', domain: 'Ciclo del agua', medium: 'Suelo y vegetación',
    focus: 'Anomalía de evaporación', band: 'water' },
  Merra2SoilMoisture: { symbol: 'θ', domain: 'Suelo', medium: 'Zona de raíces',
    focus: 'Anomalía de humedad del suelo', band: 'water' },
};
