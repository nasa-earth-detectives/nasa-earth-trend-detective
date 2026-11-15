/**
 * Climate milestones shown on the timeline (2000-2026). Editorial context, not computed by the app:
 * the figures are quoted from NASA Earth Observatory, NASA GISTEMP v4, NSIDC, and NOAA.
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
    title: 'Larsen B Ice Shelf Collapse',
    category: 'record',
    categoryLabel: 'Glacier Record',
    summary: 'Breakup of 3,250 km² of ice on the Antarctic Peninsula in just 35 days.',
    scientificImpact: 'Acceleration of tributary glacier flow into the Southern Ocean.',
    badgeColor: '#5f88a6',
  },
  2005: {
    year: 2005,
    title: 'Record Cyclone Season (Katrina)',
    category: 'anomaly',
    categoryLabel: 'Ocean Anomaly',
    summary: 'Very warm waters in the Gulf of Mexico and 28 named storms in the Atlantic.',
    scientificImpact: 'Spurred satellite monitoring of ocean heat as fuel for hurricanes.',
    badgeColor: '#d4834a',
  },
  2012: {
    year: 2012,
    title: 'Historic Arctic Sea Ice Minimum',
    category: 'record',
    categoryLabel: 'Cryosphere Low',
    summary: 'Polar sea ice extent dropped to 3.41 million km² (lowest satellite record).',
    scientificImpact: 'Accelerated Arctic amplification driven by ocean albedo feedback.',
    badgeColor: '#7fb2c9',
  },
  2015: {
    year: 2015,
    title: 'Paris Climate Agreement',
    category: 'agreement',
    categoryLabel: 'Global Governance',
    summary: 'Adopted at COP21: hold warming well below 2 °C and pursue efforts to limit it to 1.5 °C.',
    scientificImpact: 'Countries committed to report their emissions regularly.',
    badgeColor: '#93b185',
  },
  2016: {
    year: 2016,
    title: 'El Niño Global Thermal Peak',
    category: 'record',
    categoryLabel: 'Thermal Peak',
    summary: 'Anomaly of +1.02°C above the baseline average, driven by an extreme El Niño event.',
    scientificImpact: 'Mass coral bleaching on the Great Barrier Reef and tropical reefs.',
    badgeColor: '#c8703f',
  },
  2020: {
    year: 2020,
    title: 'Anthropause Effect (COVID-19)',
    category: 'anomaly',
    categoryLabel: 'Forcing Anomaly',
    summary: 'Sudden 7% drop in global emissions and aerosol reduction detected by satellites.',
    scientificImpact: 'Empirical demonstration of climate response to abrupt aerosol changes.',
    badgeColor: '#a38cb9',
  },
  2023: {
    year: 2023,
    title: 'Hottest Year in 174 Years',
    category: 'record',
    categoryLabel: 'All-Time Record',
    summary: 'Consecutive months with unprecedented global surface temperatures (+1.18°C).',
    scientificImpact: 'Record Antarctic ice loss and record sea surface temperatures.',
    badgeColor: '#b9645a',
  },
  2024: {
    year: 2024,
    title: 'GISTEMP v4 Anomaly Peak',
    category: 'record',
    categoryLabel: 'Instrumental Peak',
    summary: 'All-time high in global mean surface temperature (+1.28 °C over 1951-1980 baseline, GISTEMP v4).',
    scientificImpact: 'Imminent risk of temporarily exceeding the 1.5°C Paris threshold.',
    badgeColor: '#bf6557',
  },
  2026: {
    year: 2026,
    title: 'NASA Space Apps Challenge 2026',
    category: 'mission',
    categoryLabel: 'This project',
    summary: 'ASTRA is born at the Neiva hackathon. It is a student team project, not a NASA mission.',
    scientificImpact: 'Nine variables from open NASA data, each with its provenance in view.',
    badgeColor: '#7fb2c9',
  },
};

export const MILESTONE_YEARS = Object.keys(CLIMATE_MILESTONES).map(Number).sort((a, b) => a - b);
