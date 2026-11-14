/**
 * glossary.ts
 *
 * Climate variable glossary in accessible language for high school students
 * and the general public (target audience NASA Space Apps 2026).
 *
 * Each entry defines:
 *  - `emoji`      : visual icon of the variable
 *  - `tagline`    : short hook sentence (≤ 8 words)
 *  - `plain`      : everyday language definition (1-2 sentences)
 *  - `whyMatters` : why detecting this trend matters
 *  - `askAbout`   : question inspiring the "detective" to investigate
 *  - `exampleRegion` : emblematic region with known trend
 *  - `unit`       : everyday language unit
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
    tagline: 'Is Earth warmer than before?',
    plain:
      'It is not today’s weather temperature. It measures how different the planet is compared to the 20th-century average. A positive value means warmer; negative means cooler.',
    whyMatters:
      'When temperature rises steadily year after year, it affects glaciers, sea level, crops, and weather patterns. Detecting where it happens fastest helps understand which regions of the planet are changing most.',
    askAbout:
      'Is the Arctic warming faster than the rest of the planet?',
    exampleRegion: { label: 'Arctic (Svalbard)', lat: 78, lng: 15 },
    unit: 'degrees Celsius difference from the last century',
  },
  ModisNdvi: {
    emoji: '🌿',
    tagline: 'Are forests growing or disappearing?',
    plain:
      'NDVI measures how green an area is. It ranges from -1 (lifeless) to +1 (dense rainforest). Terra and Aqua satellites capture this by observing how plants reflect light.',
    whyMatters:
      'Forests absorb CO₂ and regulate water. When NDVI drops in a region, it can mean deforestation, drought, or wildfires. When it rises, it can indicate reforestation or increased rainfall.',
    askAbout:
      'Is the Amazon losing vegetation year after year?',
    exampleRegion: { label: 'Central Amazon', lat: -5, lng: -60 },
    unit: 'unitless index (from -1 to +1, higher = more vegetation)',
  },
  GraceMass: {
    emoji: '🧊',
    tagline: 'How much water and ice is disappearing?',
    plain:
      'GRACE and GRACE-FO satellites detect changes in Earth’s gravity to measure whether there is more or less water or ice underground or in glaciers. It works like a giant scale in space.',
    whyMatters:
      'Greenland and Antarctica are losing ice. That water flows into the sea and raises ocean levels. It also detects deep droughts when aquifers are depleted.',
    askAbout:
      'Is Greenland losing ice every year?',
    exampleRegion: { label: 'Central Greenland', lat: 72, lng: -40 },
    unit: 'centimeters of water equivalent (more negative = less mass)',
  },
  Oco2: {
    emoji: '💨',
    tagline: 'Is there more CO₂ in the air than before?',
    plain:
      'The OCO-2 satellite measures how much carbon dioxide is in an air column above every point on Earth. It is the gas that contributes most to the greenhouse effect.',
    whyMatters:
      'Factories, vehicles, and deforestation emit CO₂. Detecting where it rises fastest helps identify high-emission zones or areas where forests no longer absorb enough.',
    askAbout:
      'Is CO₂ over major industrial cities rising year after year?',
    exampleRegion: { label: 'North China industrial basin', lat: 39, lng: 116 },
    unit: 'parts per million in the air (ppm)',
  },
};

/**
 * Predefined demo regions for the wizard.
 * The jury can choose a region without having to click on the globe.
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
    label: '🏔️ Arctic',
    description: 'Fastest-warming zone on the planet',
    lat: 78,
    lng: 15,
    suggestedVariables: ['Gistemp', 'GraceMass'],
  },
  {
    id: 'amazon',
    label: '🌳 Amazon',
    description: 'Earth’s largest green lung',
    lat: -5,
    lng: -60,
    suggestedVariables: ['ModisNdvi', 'Gistemp'],
  },
  {
    id: 'sahara',
    label: '🏜️ Sahara',
    description: 'Desert expanding for decades',
    lat: 23,
    lng: 15,
    suggestedVariables: ['Gistemp', 'ModisNdvi'],
  },
  {
    id: 'greenland',
    label: '🧊 Greenland',
    description: 'Largest ice reservoir in the Northern Hemisphere',
    lat: 72,
    lng: -40,
    suggestedVariables: ['GraceMass', 'Gistemp'],
  },
  {
    id: 'southasia',
    label: '🌾 South Asia',
    description: 'Agricultural region under growing water stress',
    lat: 25,
    lng: 80,
    suggestedVariables: ['GraceMass', 'ModisNdvi'],
  },
  {
    id: 'custom',
    label: '📍 Pick on the map',
    description: 'Tap any point on the globe to select it',
    lat: 0,
    lng: 0,
    suggestedVariables: ['Gistemp'],
  },
];

/** Representative time periods for the wizard. */
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
    label: '25 years',
    description: '2000 → today · Long enough to detect clear trends',
    startYear: 2000,
    endYear: new Date().getUTCFullYear(),
  },
  {
    id: '15y',
    label: '15 years',
    description: '2010 → today · Recent trends with good coverage',
    startYear: 2010,
    endYear: new Date().getUTCFullYear(),
  },
  {
    id: '10y',
    label: '10 years',
    description: '2015 → today · Changes over the last decade',
    startYear: 2015,
    endYear: new Date().getUTCFullYear(),
  },
];
