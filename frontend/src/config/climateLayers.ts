/**
 * Catálogo único de capas científicas de la plataforma.
 *
 * Fuente de verdad compartida por el Layer Drawer y cualquier futura capa 3D.
 * Evita duplicar la metadatos de variables en varios componentes.
 */
import type { ClimateVariable, VariableMetadata } from '../types/climate.types';

/**
 * Rango de navegación: desde 2000 hasta el año en curso (UTC), siempre el actual. El año en
 * curso es parcial: la interfaz muestra hasta qué mes llegan los datos (DatasetProvenance.lastMonth).
 */
export const SATELLITE_TIMELINE = { startYear: 2000, endYear: new Date().getUTCFullYear() } as const;

/**
 * Primer año con datos reales entre todas las fuentes (MERRA-2). Es el inicio por defecto del periodo
 * de tendencia: el reto pide una serie larga, y cada fuente lo recorta después a su propia cobertura.
 */
export const EARLIEST_RECORD_YEAR = 1981;

/** Variables soportadas hoy de extremo a extremo (tipo `ClimateVariable`). */
export const CLIMATE_VARIABLES: VariableMetadata[] = [
  {
    id: 'Gistemp',
    name: 'Temperatura superficial',
    satelliteMission: 'NASA GISTEMP v4',
    unit: '°C anomalía',
    description: 'Anomalías de temperatura combinadas tierra-océano.',
    colorScheme: 'Thermal',
  },
  // MERRA-2: reanálisis de la NASA que nombra el reto. Media anual servida por NASA POWER, 1981-2025.
  {
    id: 'Merra2Temperature',
    name: 'Temperatura del aire (2 m)',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: '°C · anomalía',
    description: 'Temperatura media anual del aire a 2 m, como diferencia respecto a 1991–2020.',
    colorScheme: 'Thermal',
  },
  {
    id: 'GpmPrecipitation',
    name: 'Precipitación (satélite)',
    satelliteMission: 'GPM IMERG · NASA POWER',
    unit: 'mm/día · anomalía',
    description: 'Lluvia y nieve estimadas desde satélite, como diferencia respecto a 2001–2020.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2Precipitation',
    name: 'Precipitación (modelo)',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: 'mm/día · anomalía',
    description: 'Lluvia y nieve media anual, como diferencia respecto a 1991–2020.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2Evaporation',
    name: 'Evaporación en tierra',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: 'mm/día · anomalía',
    description: 'Agua que pasa del suelo y las plantas al aire. Sólo sobre tierra firme.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2SoilMoisture',
    name: 'Humedad del suelo',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: 'fracción 0–1 · anomalía',
    description: 'Agua disponible para las plantas en la zona de raíces. Sólo sobre tierra firme.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'ModisNdvi',
    name: 'Vegetación · NDVI',
    satelliteMission: 'MODIS Terra · NASA GIBS',
    unit: 'NDVI 0 a 1',
    description: 'Índice de vegetación: cuánta vegetación viva hay. Media mensual desde 2000.',
    colorScheme: 'Vegetation',
  },
  {
    id: 'GraceMass',
    name: 'Masa de agua y hielo',
    satelliteMission: 'GRACE / GRACE-FO',
    unit: 'cm H₂O eq.',
    description: 'Agua y hielo en tierra, pesados desde el espacio: anomalía mensual respecto a 2004-2009. Desde 2002.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Oco2',
    name: 'Dióxido de carbono',
    satelliteMission: 'OCO-2',
    unit: 'ppm XCO₂',
    description: 'CO₂ medio en toda la columna de aire, medido por el satélite OCO-2: media anual. Desde 2015.',
    colorScheme: 'Atmospheric',
  },
];

/** Lista única de códigos de variable; el catálogo de la API y la URL compartida validan contra ella. */
export const VARIABLE_IDS: readonly ClimateVariable[] = CLIMATE_VARIABLES.map(variable => variable.id);

/** Variables que también cubren el océano: sólo en ellas tiene sentido elegir entre tierra y tierra + océano. */
export const OCEAN_COVERING_VARIABLES: ReadonlySet<ClimateVariable> =
  new Set<ClimateVariable>(['Gistemp', 'Oco2', 'Merra2Temperature', 'Merra2Precipitation', 'GpmPrecipitation']);

/** Fila de estado del instrumento: capacidad presente o anunciada. */
export interface StatusRow {
  id: string;
  name: string;
  detail?: string;
  /** Marcador corto de disponibilidad. */
  status: string;
  /** Capacidad implementada; no representa el estado de carga de sus assets. */
  active?: boolean;
}

/**
 * Nivel del Mar figura en el roadmap, pero `ClimateVariable` y la API .NET
 * todavía no lo contemplan. Se declara desactivado en vez de simular soporte.
 */
export const UPCOMING_VARIABLES: StatusRow[] = [
  { id: 'sentinel6', name: 'Nivel del mar', detail: 'Sentinel-6 / ECCO', status: 'Altimetría', active: true },
];

/** Capas de análisis y dinámicas globales del planeta operativas. */
export const SCIENTIFIC_OVERLAYS: StatusRow[] = [
  { id: 'ocean-flow', name: 'Corrientes marinas 3D (ECCO/OSCAR)', status: 'Operativo', active: true },
  { id: 'teleconnections', name: 'Teleconexiones climáticas (ENSO/AMOC)', status: 'Operativo', active: true },
  { id: 'hotspots', name: 'Ondas radar en hotspots extremos', status: 'Operativo', active: true },
  { id: 'opposing', name: 'Motor de tendencias opuestas', status: 'Algoritmo', active: true },
  { id: 'satellites', name: 'Constelación satelital orbital', status: 'Operativo', active: true },
];

/** Capacidades integradas en earthSurface; los interruptores se muestran sólo si existe API real. */
export const VISUAL_SYSTEM_ROWS: StatusRow[] = [
  { id: 'atmosphere', name: 'Atmósfera', status: 'Integrado', active: true },
  { id: 'clouds', name: 'Capa de nubes', status: 'Integrado', active: true },
  { id: 'night-lights', name: 'Luces nocturnas', status: 'Integrado', active: true },
  { id: 'terminator', name: 'Terminador día/noche', status: 'Hora actual', active: true },
];
