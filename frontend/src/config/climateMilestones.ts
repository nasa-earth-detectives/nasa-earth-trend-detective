/**
 * NASA historical climate milestones catalog (2000-2026).
 * Data source: NASA Earth Observatory, NASA GISTEMP v4, NSIDC, and NOAA.
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
    categoryLabel: 'Glacial Record',
    summary: 'Breakup of 3,250 km² of ice on the Antarctic Peninsula in just 35 days.',
    scientificImpact: 'Acceleration of tributary glacier flow into the Southern Ocean.',
    badgeColor: '#38bdf8',
  },
  2005: {
    year: 2005,
    title: 'Record Hurricane Season (Katrina)',
    category: 'anomaly',
    categoryLabel: 'Ocean Anomaly',
    summary: 'Record warming in the Gulf of Mexico and 28 named storms in the Atlantic.',
    scientificImpact: 'First satellite evidence of thermal intensification in major hurricanes.',
    badgeColor: '#f97316',
  },
  2012: {
    year: 2012,
    title: 'Historic Arctic Sea Ice Minimum',
    category: 'record',
    categoryLabel: 'Cryosphere Minimum',
    summary: 'Polar sea ice extent dropped to 3.41 million km² (lowest satellite record).',
    scientificImpact: 'Accelerated Arctic amplification driven by ocean albedo feedback.',
    badgeColor: '#06b6d4',
  },
  2015: {
    year: 2015,
    title: 'Paris Climate Agreement',
    category: 'agreement',
    categoryLabel: 'Global Governance',
    summary: 'International COP21 signing setting the goal to limit warming to 1.5°C.',
    scientificImpact: 'Establishment of satellite-based global emissions inventories.',
    badgeColor: '#10b981',
  },
  2016: {
    year: 2016,
    title: 'El Niño Global Thermal Peak',
    category: 'record',
    categoryLabel: 'Thermal Peak',
    summary: 'Anomaly of +1.02°C above baseline, driven by an extreme El Niño event.',
    scientificImpact: 'Mass coral bleaching across the Great Barrier Reef and tropical reefs.',
    badgeColor: '#ef4444',
  },
  2020: {
    year: 2020,
    title: 'Anthropause Effect (COVID-19)',
    category: 'anomaly',
    categoryLabel: 'Forcing Anomaly',
    summary: 'Sudden 7% drop in global emissions and aerosol reduction detected by satellites.',
    scientificImpact: 'Empirical demonstration of climate response to abrupt aerosol changes.',
    badgeColor: '#a855f7',
  },
  2023: {
    year: 2023,
    title: 'Warmest Year in 174 Years',
    category: 'record',
    categoryLabel: 'Absolute Record',
    summary: 'Consecutive months with unprecedented global surface temperatures (+1.18°C).',
    scientificImpact: 'Record Antarctic ice loss and record sea surface temperatures.',
    badgeColor: '#e11d48',
  },
  2024: {
    year: 2024,
    title: 'GISTEMP v4 Anomaly Peak',
    category: 'record',
    categoryLabel: 'Instrumental Peak',
    summary: 'All-time high global mean surface temperature (+1.28°C above 1951–1980 mean, GISTEMP v4).',
    scientificImpact: 'Imminent risk of transiently exceeding the 1.5°C Paris threshold.',
    badgeColor: '#f43f5e',
  },
  2026: {
    year: 2026,
    title: 'NASA Earth Trend Detective Mission',
    category: 'mission',
    categoryLabel: 'Active Mission',
    summary: 'Interactive 3D platform for geo-temporal detection of climate trends and teleconnections.',
    scientificImpact: 'Analytical democratization of petabytes of NASA satellite mission data.',
    badgeColor: '#06b6d4',
  },
};

export const MILESTONE_YEARS = Object.keys(CLIMATE_MILESTONES).map(Number).sort((a, b) => a - b);
