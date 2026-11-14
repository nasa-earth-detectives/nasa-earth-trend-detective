/**
 * Unified scientific layers catalog for the platform.
 *
 * Single source of truth shared by the Layer Drawer and any future 3D layers.
 * Prevents duplicating variable metadata across multiple components.
 */
import { VariableMetadata } from '../types/climate.types';

/**
 * Navigation range: from 2000 to the current UTC year. The current year
 * is partial: the UI shows which month data extends to (DatasetProvenance.lastMonth).
 */
export const SATELLITE_TIMELINE = { startYear: 2000, endYear: new Date().getUTCFullYear() } as const;

/** End-to-end supported variables today (`ClimateVariable` type). */
export const CLIMATE_VARIABLES: VariableMetadata[] = [
  {
    id: 'Gistemp',
    name: 'Surface Temperature',
    satelliteMission: 'NASA GISTEMP v4',
    unit: '°C anomaly',
    description: 'Combined land-ocean temperature anomalies.',
    colorScheme: 'Thermal',
  },
  {
    id: 'ModisNdvi',
    name: 'Vegetation · NDVI',
    satelliteMission: 'Terra/Aqua MODIS',
    unit: 'NDVI −1 to 1',
    description: 'Photosynthetic vigor and plant biomass cover.',
    colorScheme: 'Vegetation',
  },
  {
    id: 'GraceMass',
    name: 'Water & Ice Mass',
    satelliteMission: 'GRACE / GRACE-FO',
    unit: 'cm H₂O eq.',
    description: 'Gravitational anomalies of water and ice reserves.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Oco2',
    name: 'Carbon Dioxide',
    satelliteMission: 'OCO-2 / OCO-3',
    unit: 'ppm XCO₂',
    description: 'Total atmospheric column CO₂ mole fraction.',
    colorScheme: 'Atmospheric',
  },
];

/** Instrument status row: present or announced capability. */
export interface StatusRow {
  id: string;
  name: string;
  detail?: string;
  /** Short availability badge/label. */
  status: string;
  /** Implemented capability; does not represent asset loading state. */
  active?: boolean;
}

/**
 * Sea Level is on the roadmap, but `ClimateVariable` and the .NET API
 * do not support it yet. It is declared disabled instead of simulating support.
 */
export const UPCOMING_VARIABLES: StatusRow[] = [
  { id: 'sentinel6', name: 'Sea Level', detail: 'Sentinel-6 / ECCO', status: 'Altimetry', active: true },
];

/** Operational planetary dynamic and analysis overlay layers. */
export const SCIENTIFIC_OVERLAYS: StatusRow[] = [
  { id: 'ocean-flow', name: '3D Ocean Currents (ECCO/OSCAR)', status: 'Operational', active: true },
  { id: 'teleconnections', name: 'Climate Teleconnections (ENSO/AMOC)', status: 'Operational', active: true },
  { id: 'hotspots', name: 'Radar Ripples on Extreme Hotspots', status: 'Operational', active: true },
  { id: 'opposing', name: 'Opposing Trends Engine', status: 'Algorithm', active: true },
  { id: 'satellites', name: 'Orbital Satellite Constellation', status: 'Operational', active: true },
];

/** Visual system capabilities integrated into earthSurface; switches are shown only if a real API exists. */
export const VISUAL_SYSTEM_ROWS: StatusRow[] = [
  { id: 'atmosphere', name: 'Atmosphere', status: 'Integrated', active: true },
  { id: 'clouds', name: 'Cloud Layer', status: 'Integrated', active: true },
  { id: 'night-lights', name: 'Night Lights', status: 'Integrated', active: true },
  { id: 'terminator', name: 'Day/Night Terminator', status: 'Live UTC', active: true },
];
