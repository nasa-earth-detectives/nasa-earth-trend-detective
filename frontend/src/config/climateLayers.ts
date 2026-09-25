/**
 * Catálogo único de capas científicas de la plataforma.
 *
 * Fuente de verdad compartida por el Layer Drawer y cualquier futura capa 3D.
 * Evita duplicar la metadatos de variables en varios componentes.
 */
import { VariableMetadata } from '../types/climate.types';

/** Rango de navegación configurado (2000-2026 para análisis multidecenal de la NASA). */
export const SATELLITE_TIMELINE = { startYear: 2000, endYear: 2026 } as const;

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
  {
    id: 'ModisNdvi',
    name: 'Vegetación · NDVI',
    satelliteMission: 'Terra/Aqua MODIS',
    unit: 'NDVI −1 a 1',
    description: 'Vigor fotosintético y cobertura de biomasa vegetal.',
    colorScheme: 'Vegetation',
  },
  {
    id: 'GraceMass',
    name: 'Masa de agua y hielo',
    satelliteMission: 'GRACE / GRACE-FO',
    unit: 'cm H₂O eq.',
    description: 'Anomalías gravitatorias de reservas de agua y hielo.',
    colorScheme: 'Hydrology',
  },
  {
    id: 'Oco2',
    name: 'Dióxido de carbono',
    satelliteMission: 'OCO-2 / OCO-3',
    unit: 'ppm XCO₂',
    description: 'Fracción molar de CO₂ en columna atmosférica total.',
    colorScheme: 'Atmospheric',
  },
];

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
  { id: 'sentinel6', name: 'Nivel del mar', detail: 'Sentinel-6', status: 'API' },
];

/** Capas futuras; hexágonos y calor tienen su propio control operativo en Datos. */
export const SCIENTIFIC_OVERLAYS: StatusRow[] = [
  { id: 'hotspots', name: 'Hotspots significativos', status: 'Pronto' },
  { id: 'opposing', name: 'Tendencias opuestas', status: 'Pronto' },
  { id: 'teleconnections', name: 'Teleconexiones', status: 'Pronto' },
];

/** Capacidades integradas en earthSurface; los interruptores se muestran sólo si existe API real. */
export const VISUAL_SYSTEM_ROWS: StatusRow[] = [
  { id: 'atmosphere', name: 'Atmósfera', status: 'Integrado', active: true },
  { id: 'clouds', name: 'Capa de nubes', status: 'Integrado', active: true },
  { id: 'night-lights', name: 'Luces nocturnas', status: 'Integrado', active: true },
  { id: 'terminator', name: 'Terminador día/noche', status: 'Hora actual', active: true },
];
