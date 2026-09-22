/**
 * Catálogo de hitos climáticos históricos de la NASA (2000-2026).
 * Fuente de datos: NASA Earth Observatory, NASA GISTEMP v4, NSIDC y NOAA.
 */

export type MilestoneCategory = 'anomaly' | 'agreement' | 'record' | 'mission';

export interface ClimateMilestone {
  year: number;
  title: string;
  category: MilestoneCategory;
  categoryLabel: string;
  summary: string;
  scientificImpact: string;
  badgeColor: string;
}

export const CLIMATE_MILESTONES: Record<number, ClimateMilestone> = {
  2002: {
    year: 2002,
    title: 'Colapso de Plataforma Larsen B',
    category: 'record',
    categoryLabel: 'Récord Glaciar',
    summary: 'Desprendimiento de 3.250 km² de hielo en la Península Antártica en solo 35 días.',
    scientificImpact: 'Aceleración del flujo de glaciares tributarios hacia el océano antártico.',
    badgeColor: '#38bdf8',
  },
  2005: {
    year: 2005,
    title: 'Temporada Ciclónica Récord (Katrina)',
    category: 'anomaly',
    categoryLabel: 'Anomalía Oceánica',
    summary: 'Calentamiento récord en el Golfo de México y 28 tormentas nombradas en el Atlántico.',
    scientificImpact: 'Primera evidencia satelital de intensificación térmica en huracanes mayores.',
    badgeColor: '#f97316',
  },
  2012: {
    year: 2012,
    title: 'Mínimo Histórico de Hielo Ártico',
    category: 'record',
    categoryLabel: 'Mínimo Criósfera',
    summary: 'La extensión de hielo marino polar cayó a 3,41 millones de km² (el registro más bajo satelital).',
    scientificImpact: 'Amplificación ártica acelerada por retroalimentación de albedo oceánico.',
    badgeColor: '#06b6d4',
  },
  2015: {
    year: 2015,
    title: 'Acuerdo de París sobre el Clima',
    category: 'agreement',
    categoryLabel: 'Gobernanza Global',
    summary: 'Firma internacional de la COP21 fijando la meta de limitar el calentamiento a 1,5°C.',
    scientificImpact: 'Establecimiento de inventarios de emisiones globales basados en satélites.',
    badgeColor: '#10b981',
  },
  2016: {
    year: 2016,
    title: 'Máximo Térmico Global El Niño',
    category: 'record',
    categoryLabel: 'Pico Térmico',
    summary: 'Anomalía de +1,02°C sobre la media base, impulsada por un evento El Niño de intensidad extrema.',
    scientificImpact: 'Blanqueamiento masivo de corales en la Gran Barrera y arrecifes tropicales.',
    badgeColor: '#ef4444',
  },
  2020: {
    year: 2020,
    title: 'Efecto Antropausa (COVID-19)',
    category: 'anomaly',
    categoryLabel: 'Anomalía Forzamiento',
    summary: 'Caída súbita del 7% en emisiones globales y reducción de aerosoles detectada por satélites.',
    scientificImpact: 'Demostración empírica de respuesta climática ante cambios abruptos en aerosoles.',
    badgeColor: '#a855f7',
  },
  2023: {
    year: 2023,
    title: 'Año Más Caluroso en 174 Años',
    category: 'record',
    categoryLabel: 'Récord Absoluto',
    summary: 'Meses consecutivos con temperaturas globales superficiales sin precedentes (+1,18°C).',
    scientificImpact: 'Pérdida récord de hielo en la Antártida y temperaturas récord en superficie marina.',
    badgeColor: '#e11d48',
  },
  2024: {
    year: 2024,
    title: 'Cúspide de Anomalía GISTEMP v4',
    category: 'record',
    categoryLabel: 'Cúspide Instrumental',
    summary: 'Máximo histórico de temperatura media global superficial (+1,28°C s/ media preindustrial).',
    scientificImpact: 'Riesgo inminente de rebasamiento transitorio del umbral de 1,5°C de París.',
    badgeColor: '#f43f5e',
  },
  2026: {
    year: 2026,
    title: 'Misión NASA Earth Trend Detective',
    category: 'mission',
    categoryLabel: 'Misión Activa',
    summary: 'Plataforma interactiva 3D para la detección geo-temporal de tendencias y teleconexiones.',
    scientificImpact: 'Democratización analítica de petabytes de datos de misiones satelitales de la NASA.',
    badgeColor: '#06b6d4',
  },
};

export const MILESTONE_YEARS = Object.keys(CLIMATE_MILESTONES).map(Number).sort((a, b) => a - b);
