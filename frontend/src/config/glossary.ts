/**
 * glossary.ts
 *
 * Glosario de variables climáticas en lenguaje accesible para estudiantes
 * de secundaria y público general (audiencia objetivo NASA Space Apps 2026).
 *
 * Cada entrada define:
 *  - `emoji`      : ícono visual de la variable
 *  - `tagline`    : frase corta de gancho (≤ 8 palabras)
 *  - `plain`      : definición en lenguaje cotidiano (1-2 oraciones)
 *  - `whyMatters` : por qué importa detectar esta tendencia
 *  - `askAbout`   : pregunta que inspira al "detective" a investigar
 *  - `exampleRegion` : región emblemática con tendencia conocida
 *  - `unit`       : unidad en lenguaje cotidiano
 */

import type { ClimateVariable } from '../types/climate.types';

export interface GlossaryEntry {
  emoji: string;
  tagline: string;
  plain: string;
  whyMatters: string;
  askAbout: string;
  exampleRegion: { label: string; lat: number; lng: number };
  unit: string;
}

export const VARIABLE_GLOSSARY: Record<ClimateVariable, GlossaryEntry> = {
  Gistemp: {
    emoji: '🌡️',
    tagline: '¿Está la Tierra más caliente que antes?',
    plain:
      'No es la temperatura del día de hoy. Es qué tan diferente está el planeta comparado con el promedio del siglo XX. Un valor positivo significa más calor; negativo, más frío.',
    whyMatters:
      'Cuando la temperatura sube de forma constante año tras año, eso afecta los glaciares, el nivel del mar, las cosechas y los patrones climáticos. Detectar dónde ocurre más rápido ayuda a entender qué zonas del planeta cambian más.',
    askAbout:
      '¿Está calentando el Ártico más rápido que el resto del planeta?',
    exampleRegion: { label: 'Ártico (Svalbard)', lat: 78, lng: 15 },
    unit: 'grados Celsius de diferencia respecto al siglo pasado',
  },
  ModisNdvi: {
    emoji: '🌿',
    tagline: '¿Están los bosques creciendo o desapareciendo?',
    plain:
      'El NDVI mide qué tan verde está una zona. Va de -1 (sin vida) a +1 (selva densa). Los satélites Terra y Aqua capturan este dato mirando cómo las plantas reflejan la luz.',
    whyMatters:
      'Los bosques absorben CO₂ y regulan el agua. Cuando el NDVI baja en una región, puede significar deforestación, sequía o incendios. Cuando sube, puede indicar reforestación o más lluvia.',
    askAbout:
      '¿Está la Amazonía perdiendo vegetación año tras año?',
    exampleRegion: { label: 'Amazonía central', lat: -5, lng: -60 },
    unit: 'índice sin unidad (de -1 a +1, mayor = más vegetación)',
  },
  GraceMass: {
    emoji: '🧊',
    tagline: '¿Cuánta agua y hielo está desapareciendo?',
    plain:
      'Los satélites GRACE y GRACE-FO detectan cambios en la gravedad de la Tierra para medir si hay más o menos agua o hielo bajo tierra o en los glaciares. Es como una balanza gigante en el espacio.',
    whyMatters:
      'Groenlandia y la Antártida están perdiendo hielo. Esa agua llega al mar y sube el nivel de los océanos. También detecta sequías profundas cuando los acuíferos se agotan.',
    askAbout:
      '¿Groenlandia está perdiendo hielo cada año?',
    exampleRegion: { label: 'Groenlandia central', lat: 72, lng: -40 },
    unit: 'centímetros equivalentes de agua (más negativo = menos masa)',
  },
  Oco2: {
    emoji: '💨',
    tagline: '¿Hay más CO₂ en el aire que antes?',
    plain:
      'El satélite OCO-2 mide cuánto dióxido de carbono hay en una columna de aire sobre cada punto de la Tierra. Es el gas que más contribuye al efecto invernadero.',
    whyMatters:
      'Las fábricas, los autos y la deforestación emiten CO₂. Detectar dónde aumenta más rápido ayuda a identificar zonas de alta emisión o zonas donde los bosques ya no absorben suficiente.',
    askAbout:
      '¿El CO₂ sobre las grandes ciudades industriales aumenta año a año?',
    exampleRegion: { label: 'Cuenca industrial norte de China', lat: 39, lng: 116 },
    unit: 'partes por millón en el aire (ppm)',
  },
};

/**
 * Regiones de demostración predefinidas para el wizard.
 * El jurado puede elegir una región sin tener que hacer clic en el globo.
 */
export interface WizardRegion {
  id: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
  suggestedVariables: ClimateVariable[];
}

export const WIZARD_REGIONS: WizardRegion[] = [
  {
    id: 'arctic',
    label: '🏔️ Ártico',
    description: 'Zona de calentamiento más rápido del planeta',
    lat: 78,
    lng: 15,
    suggestedVariables: ['Gistemp', 'GraceMass'],
  },
  {
    id: 'amazon',
    label: '🌳 Amazonía',
    description: 'El pulmón verde más grande de la Tierra',
    lat: -5,
    lng: -60,
    suggestedVariables: ['ModisNdvi', 'Gistemp'],
  },
  {
    id: 'sahara',
    label: '🏜️ Sahara',
    description: 'Desierto en expansión desde hace décadas',
    lat: 23,
    lng: 15,
    suggestedVariables: ['Gistemp', 'ModisNdvi'],
  },
  {
    id: 'greenland',
    label: '🧊 Groenlandia',
    description: 'El mayor reservorio de hielo del hemisferio norte',
    lat: 72,
    lng: -40,
    suggestedVariables: ['GraceMass', 'Gistemp'],
  },
  {
    id: 'southasia',
    label: '🌾 Asia del Sur',
    description: 'Región agrícola bajo estrés hídrico creciente',
    lat: 25,
    lng: 80,
    suggestedVariables: ['GraceMass', 'ModisNdvi'],
  },
  {
    id: 'custom',
    label: '📍 Elegir en el mapa',
    description: 'Toca cualquier punto del globo para seleccionarlo',
    lat: 0,
    lng: 0,
    suggestedVariables: ['Gistemp'],
  },
];

/** Períodos representativos para el wizard. */
export interface WizardPeriod {
  id: string;
  label: string;
  description: string;
  startYear: number;
  endYear: number;
}

export const WIZARD_PERIODS: WizardPeriod[] = [
  {
    id: '25y',
    label: '25 años',
    description: '2000 → hoy · Suficiente para detectar tendencias claras',
    startYear: 2000,
    endYear: new Date().getUTCFullYear(),
  },
  {
    id: '15y',
    label: '15 años',
    description: '2010 → hoy · Tendencias recientes con buena cobertura',
    startYear: 2010,
    endYear: new Date().getUTCFullYear(),
  },
  {
    id: '10y',
    label: '10 años',
    description: '2015 → hoy · Cambios de la última década',
    startYear: 2015,
    endYear: new Date().getUTCFullYear(),
  },
];
