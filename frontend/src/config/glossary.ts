/**
 * glossary.ts
 *
 * Climate variable glossary in plain language for high-school students
 * and the general public (NASA Space Apps 2026 target audience).
 *
 * Each entry defines:
 *  - `tagline`       : short hook phrase (<= 8 words)
 *  - `plain`         : everyday-language definition (1-2 sentences)
 *  - `whyMatters`    : why detecting this trend matters
 *  - `askAbout`      : question that inspires the "detective" to investigate
 *  - `exampleRegion` : landmark region with a known trend
 *  - `unit`          : unit in everyday language
 */

import type { ClimateVariable } from '../types/climate.types';

export interface GlossaryEntry {
  tagline: string;
  plain: string;
  whyMatters: string;
  askAbout: string;
  exampleRegion: { label: string; lat: number; lng: number };
  unit: string;
}

export const VARIABLE_GLOSSARY: Record<ClimateVariable, GlossaryEntry> = {
  Gistemp: {
    tagline: 'Is Earth warmer than before?',
    plain:
      'Not today\'s weather temperature. It is how different the planet is compared to the 20th-century average. Positive values mean warmer; negative, cooler.',
    whyMatters:
      'When temperature rises steadily year after year, it affects glaciers, sea level, crops, and weather patterns. Spotting where it changes fastest helps show which parts of the planet are shifting most.',
    askAbout:
      'Is the Arctic warming faster than the rest of the planet?',
    exampleRegion: { label: 'Arctic (Svalbard)', lat: 78, lng: 15 },
    unit: 'degrees Celsius difference from the last century',
  },
  Merra2Temperature: {
    tagline: 'Is the air we breathe getting warmer?',
    plain:
      'The air temperature two meters above the ground, averaged over the whole year. Computed by MERRA-2, a NASA model combining satellites, balloons, and weather stations. Shown here relative to the 1991–2020 average.',
    whyMatters:
      'This is the temperature experienced by people, crops, and animals. Small but sustained changes affect harvests, ice, and water demand.',
    askAbout:
      'Where is air temperature rising and where is it falling?',
    exampleRegion: { label: 'Central Amazon', lat: -3, lng: -61 },
    unit: 'degrees Celsius difference relative to 1991–2020',
  },
  Merra2Precipitation: {
    tagline: 'Is it raining more or less than before?',
    plain:
      'The average daily rain and snow over the year, in millimeters. One millimeter equals one liter of water per square meter. Values come from NASA\'s MERRA-2 model.',
    whyMatters:
      'Rivers, crops, and drinking water depend on rainfall. The same variable can rise in one region and fall in another, so you have to inspect place by place.',
    askAbout:
      'Where is rainfall increasing and where is it decreasing?',
    exampleRegion: { label: 'Central Sahel', lat: 15, lng: 5 },
    unit: 'millimeters of water per day, relative to 1991–2020',
  },
  GpmPrecipitation: {
    tagline: 'What rainfall do satellites see?',
    plain:
      'Rain and snow estimated from space by the GPM mission, which merges measurements from multiple satellites into a product called IMERG. Given in millimeters per day, averaged over the year, since 1998.',
    whyMatters:
      'It is a measurement made from satellites rather than a model. Comparing it with MERRA-2 precipitation in the same spot shows whether two independent sources tell the same story.',
    askAbout:
      'Do the satellite and the model show the same trend here?',
    exampleRegion: { label: 'Eastern Bangladesh', lat: 23, lng: 91 },
    unit: 'millimeters of water per day, relative to 2001–2020',
  },
  Merra2Evaporation: {
    tagline: 'How much water leaves the soil for the air?',
    plain:
      'Evaporation is water moving from the soil and plants into the air. It is measured in millimeters per day, just like rainfall, and here exists only over land.',
    whyMatters:
      'If more water evaporates than falls as rain, the soil dries out. Comparing evaporation and rainfall in the same place helps reveal whether a region is gaining or losing water.',
    askAbout:
      'Does evaporation shift in the same direction as rainfall?',
    exampleRegion: { label: 'Ganges Plain', lat: 25, lng: 81 },
    unit: 'millimeters of water per day, relative to 1991–2020',
  },
  Merra2SoilMoisture: {
    tagline: 'Does the soil hold enough water for plants?',
    plain:
      'Indicates how much water is in the root-zone soil layer. It ranges from 0 (bone dry) to 1 (water-saturated) and exists only over land.',
    whyMatters:
      'With low soil moisture, plants suffer even if a little rain falls. It is an early signal of drought and directly affects agriculture.',
    askAbout:
      'Are there regions where the soil dries out year after year?',
    exampleRegion: { label: 'Iberian Peninsula', lat: 39, lng: -3 },
    unit: '0 to 1 fraction, relative to 1991–2020',
  },
  ModisNdvi: {
    tagline: 'Are forests growing or disappearing?',
    plain:
      'NDVI measures how green an area is, from 0 (bare ground) to 1 (dense rainforest). The MODIS instrument aboard the Terra satellite obtains it by observing how plants reflect light.',
    whyMatters:
      'Forests absorb CO₂ and regulate water. When NDVI drops in a region, it can signal deforestation, drought, or wildfires. When it rises, it may point to reforestation or more rain.',
    askAbout:
      'Is the Amazon losing vegetation year after year?',
    exampleRegion: { label: 'Central Amazon', lat: -5, lng: -60 },
    unit: 'unitless index (0 to 1, higher = more vegetation)',
  },
  GraceMass: {
    tagline: 'How much water and ice is disappearing?',
    plain:
      'The GRACE and GRACE-FO satellites detect shifts in Earth\'s gravity to weigh whether there is more or less water or ice underground or in glaciers—like a giant scale in space.',
    whyMatters:
      'Greenland and Antarctica are losing ice. That water flows into the sea and raises ocean levels. It also detects deep droughts when aquifers are depleted.',
    askAbout:
      'Is Greenland losing ice every year?',
    // Greenland's interior barely changes (measured: +0.37 cm/yr, p = 0.08); the loss is along the coast.
    exampleRegion: { label: 'Southeast Greenland', lat: 69, lng: -33 },
    unit: 'centimeters of equivalent water thickness (more negative = less mass)',
  },
  Oco2: {
    tagline: 'Is there more CO₂ in the air than before?',
    plain:
      'The OCO-2 satellite measures how much carbon dioxide sits in an air column above each point on Earth. It is the gas that contributes most to the greenhouse effect.',
    // Measured in loaded data (2015-2025): rises across all 3,139 cells with series, between 2.30 and 2.70 ppm
    // per year. Regional differences are small: the satellite sees the well-mixed air, not the smokestack.
    whyMatters:
      'Factories, cars, and deforestation emit CO₂, and winds mix it across the entire planet. That is why it rises at nearly the same pace everywhere, even over the middle of the ocean: around 2.5 parts per million each year.',
    askAbout:
      'Does CO₂ also rise far from cities, in the middle of the Pacific?',
    exampleRegion: { label: 'Hawaii, near Mauna Loa Observatory', lat: 19, lng: -155 },
    unit: 'parts per million in air (ppm)',
  },
};
