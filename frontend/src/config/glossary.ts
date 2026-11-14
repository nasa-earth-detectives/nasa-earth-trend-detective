/**
 * glossary.ts
 *
 * Climate variable glossary in plain language for high school students
 * and the general public (NASA Space Apps 2026 target audience).
 *
 * Each entry defines:
 *  - `tagline`       : short hook phrase (≤ 8 words)
 *  - `plain`         : everyday-language definition (1-2 sentences)
 *  - `whyMatters`    : why detecting this trend matters
 *  - `askAbout`      : question that inspires the "detective" to investigate
 *  - `exampleRegion` : emblematic region with a known trend
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
      'It is not today’s weather temperature. It is how different the planet is compared to the 20th-century average. A positive value means warmer; negative means cooler.',
    whyMatters:
      'When temperature rises steadily year after year, it affects glaciers, sea levels, crops, and weather patterns. Detecting where it happens fastest helps show which parts of Earth are changing most.',
    askAbout:
      'Is the Arctic warming faster than the rest of the planet?',
    exampleRegion: { label: 'Arctic (Svalbard)', lat: 78, lng: 15 },
    unit: 'degrees Celsius difference from the last century',
  },
  Merra2Temperature: {
    tagline: 'Is the air we breathe getting warmer?',
    plain:
      'The air temperature two meters above the ground, averaged over the entire year. Calculated by MERRA-2, a NASA model combining satellites, weather balloons, and stations. Shown relative to the 1991–2020 average.',
    whyMatters:
      'This is the temperature felt by people, crops, and wildlife. Small but sustained shifts affect harvests, ice melt, and water demand.',
    askAbout:
      'Where is air temperature rising and where is it falling?',
    exampleRegion: { label: 'Central Amazon', lat: -3, lng: -61 },
    unit: 'degrees Celsius difference from 1991–2020',
  },
  Merra2Precipitation: {
    tagline: 'Is it raining more or less than before?',
    plain:
      'The average rain and snow falling each day of the year, in millimeters. One millimeter equals one liter of water per square meter. Values come from MERRA-2, NASA’s reanalysis model.',
    whyMatters:
      'Rivers, crops, and drinking water depend on rainfall. The same variable can rise in one region and fall in another, so you have to check place by place.',
    askAbout:
      'Where is it raining more and where is it raining less?',
    exampleRegion: { label: 'Central Sahel', lat: 15, lng: 5 },
    unit: 'millimeters of water per day, relative to 1991–2020',
  },
  GpmPrecipitation: {
    tagline: 'What rainfall do satellites see?',
    plain:
      'Rain and snow estimated from space by the GPM mission, combining measurements from multiple satellites into a product called IMERG. Given in millimeters per day, averaged over the year, since 1998.',
    whyMatters:
      'This is a satellite measurement rather than a model. Comparing it with MERRA-2 precipitation at the same spot shows whether two independent sources tell the same story.',
    askAbout:
      'Do the satellite and the model see the same trend here?',
    exampleRegion: { label: 'Eastern Bangladesh', lat: 23, lng: 91 },
    unit: 'millimeters of water per day, relative to 2001–2020',
  },
  Merra2Evaporation: {
    tagline: 'How much water leaves the soil for the air?',
    plain:
      'Evaporation is water moving from soil and plants into the air. Measured in millimeters per day, just like rainfall, and available here over land only.',
    whyMatters:
      'If more water evaporates than falls as rain, the soil dries out. Comparing evaporation and rainfall in the same place helps reveal whether a region is gaining or losing water.',
    askAbout:
      'Is evaporation changing in the same direction as rainfall?',
    exampleRegion: { label: 'Ganges Plain', lat: 25, lng: 81 },
    unit: 'millimeters of water per day, relative to 1991–2020',
  },
  Merra2SoilMoisture: {
    tagline: 'Does the soil hold enough water for plants?',
    plain:
      'Shows how much water is stored in the root-zone soil layer where plants grow. Ranges from 0 (bone dry) to 1 (saturated) and exists over land only.',
    whyMatters:
      'With low soil moisture, plants suffer even if a little rain falls. It is an early signal of drought and directly impacts agriculture.',
    askAbout:
      'Are there regions where soil is drying out year after year?',
    exampleRegion: { label: 'Iberian Peninsula', lat: 39, lng: -3 },
    unit: 'fraction from 0 to 1, relative to 1991–2020',
  },
  ModisNdvi: {
    tagline: 'Are forests growing or disappearing?',
    plain:
      'NDVI measures how green an area is, from 0 (bare ground) to 1 (dense rainforest). The MODIS instrument aboard NASA’s Terra satellite captures it by measuring how plants reflect light.',
    whyMatters:
      'Forests absorb CO₂ and regulate water. When NDVI drops in a region, it can signal deforestation, drought, or wildfires. When it rises, it may indicate regrowth or wetter conditions.',
    askAbout:
      'Is the Amazon losing vegetation year after year?',
    exampleRegion: { label: 'Central Amazon', lat: -5, lng: -60 },
    unit: 'unitless index (0 to 1, higher = greener vegetation)',
  },
  GraceMass: {
    tagline: 'How much water and ice is disappearing?',
    plain:
      'The GRACE and GRACE-FO satellites detect tiny shifts in Earth’s gravity to measure whether water or ice underground and in glaciers is increasing or shrinking—like a giant scale in space.',
    whyMatters:
      'Greenland and Antarctica are losing ice, and that meltwater raises sea levels. It also reveals deep droughts when underground aquifers are depleted.',
    askAbout:
      'Is Greenland losing ice every year?',
    exampleRegion: { label: 'Central Greenland', lat: 72, lng: -40 },
    unit: 'centimeters of equivalent water (more negative = less mass)',
  },
  Oco2: {
    tagline: 'Is there more CO₂ in the air than before?',
    plain:
      'The OCO-2 satellite measures how much carbon dioxide is in a column of air above each point on Earth. It is the main greenhouse gas driving global warming.',
    whyMatters:
      'Factories, vehicles, and deforestation release CO₂. Detecting where it rises fastest helps pinpoint high-emission regions or areas where forests no longer absorb enough.',
    askAbout:
      'Is CO₂ over major industrial cities increasing year after year?',
    exampleRegion: { label: 'North China Industrial Basin', lat: 39, lng: 116 },
    unit: 'parts per million in air (ppm)',
  },
};
