/**
 * Single catalog of scientific layers for the platform.
 *
 * Shared source of truth for the Layer Drawer and any future 3D layer.
 * Avoids duplicating variable metadata across multiple components.
 */
import type { ClimateVariable, VariableMetadata } from '../types/climate.types';

/**
 * Navigation range: from 2000 to the current year (UTC). The current year
 * is partial: the UI shows up to which month data is available (DatasetProvenance.lastMonth).
 */
export const SATELLITE_TIMELINE = { startYear: 2000, endYear: new Date().getUTCFullYear() } as const;

/**
 * Earliest year with real data across all sources (MERRA-2). Default start of the trend
 * period: the challenge requires a long series, and each source trims it to its own coverage.
 */
export const EARLIEST_RECORD_YEAR = 1981;

/** Variables currently supported end-to-end (`ClimateVariable` type). */
export const CLIMATE_VARIABLES: VariableMetadata[] = [
  {
    id: 'Gistemp',
    name: 'Surface temperature',
    satelliteMission: 'NASA GISTEMP v4',
    unit: '°C anomaly',
    description: 'Combined land-ocean surface temperature anomalies.',
    colorScheme: 'Thermal',
  },
  // MERRA-2: NASA reanalysis named in the challenge. Annual mean served by NASA POWER, 1981-2025.
  {
    id: 'Merra2Temperature',
    name: 'Air temperature (2 m)',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: '°C · anomaly',
    description: 'Annual mean air temperature at 2 m, as difference relative to 1991–2020.',
    colorScheme: 'Thermal',
  },
  {
    id: 'GpmPrecipitation',
    name: 'Precipitation (satellite)',
    satelliteMission: 'GPM IMERG · NASA POWER',
    unit: 'mm/day · anomaly',
    description: 'Satellite-estimated rain and snow, as difference relative to 2001–2020.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2Precipitation',
    name: 'Precipitation (model)',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: 'mm/day · anomaly',
    description: 'Annual mean rain and snow, as difference relative to 1991–2020.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2Evaporation',
    name: 'Land evaporation',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: 'mm/day · anomaly',
    description: 'Water moving from soil and plants into the air. Land only.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Merra2SoilMoisture',
    name: 'Soil moisture',
    satelliteMission: 'MERRA-2 · NASA POWER',
    unit: '0–1 fraction · anomaly',
    description: 'Water available to plants in the root zone. Land only.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'ModisNdvi',
    name: 'Vegetation · NDVI',
    satelliteMission: 'MODIS Terra · NASA GIBS',
    unit: 'NDVI 0 to 1',
    description: 'Vegetation index: how much live vegetation is present. Monthly mean since 2000.',
    colorScheme: 'Vegetation',
  },
  {
    id: 'GraceMass',
    name: 'Water & ice mass',
    satelliteMission: 'GRACE / GRACE-FO',
    unit: 'cm H₂O eq.',
    description: 'Gravitational anomalies of water and ice reserves.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Oco2',
    name: 'Carbon dioxide',
    satelliteMission: 'OCO-2 / OCO-3',
    unit: 'ppm XCO₂',
    description: 'Column-averaged dry-air mole fraction of CO₂ in the atmosphere.',
    colorScheme: 'Atmospheric',
  },
];

/** Canonical list of variable codes; the API catalog and shared URL validate against it. */
export const VARIABLE_IDS: readonly ClimateVariable[] = CLIMATE_VARIABLES.map(variable => variable.id);

/** Variables that also cover the ocean: only here does choosing land vs. land + ocean make sense. */
export const OCEAN_COVERING_VARIABLES: ReadonlySet<ClimateVariable> =
  new Set<ClimateVariable>(['Gistemp', 'Oco2', 'Merra2Temperature', 'Merra2Precipitation', 'GpmPrecipitation']);

/** Instrument status row: present or announced capability. */
export interface StatusRow {
  id: string;
  name: string;
  detail?: string;
  /** Short availability tag. */
  status: string;
  /** Implemented capability; does not represent the load state of its assets. */
  active?: boolean;
}

/**
 * Sea Level is on the roadmap, but `ClimateVariable` and the .NET API
 * do not support it yet. Declared disabled instead of simulating support.
 */
export const UPCOMING_VARIABLES: StatusRow[] = [
  { id: 'sentinel6', name: 'Sea level', detail: 'Sentinel-6 / ECCO', status: 'Altimetry', active: true },
];

/** Operational global planetary analysis and dynamics layers. */
export const SCIENTIFIC_OVERLAYS: StatusRow[] = [
  { id: 'ocean-flow', name: '3D ocean currents (ECCO/OSCAR)', status: 'Operational', active: true },
  { id: 'teleconnections', name: 'Climate teleconnections (ENSO/AMOC)', status: 'Operational', active: true },
  { id: 'hotspots', name: 'Radar ripples on extreme hotspots', status: 'Operational', active: true },
  { id: 'opposing', name: 'Opposing trends engine', status: 'Algorithm', active: true },
  { id: 'satellites', name: 'Orbital satellite constellation', status: 'Operational', active: true },
];

/** Built-in earthSurface capabilities; toggles are shown only if a real API exists. */
export const VISUAL_SYSTEM_ROWS: StatusRow[] = [
  { id: 'atmosphere', name: 'Atmosphere', status: 'Built-in', active: true },
  { id: 'clouds', name: 'Cloud layer', status: 'Built-in', active: true },
  { id: 'night-lights', name: 'Night lights', status: 'Built-in', active: true },
  { id: 'terminator', name: 'Day/night terminator', status: 'Current time', active: true },
];
