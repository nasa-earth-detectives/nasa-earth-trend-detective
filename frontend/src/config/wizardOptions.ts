/**
 * Options for the "Trend Detective" wizard: starting regions and analysis periods.
 * Kept separate from glossary.ts so neither file exceeds the CI line limit.
 */
import type { ClimateVariable } from '../types/climate.types';
import { EARLIEST_RECORD_YEAR } from './climateLayers';

/** Preset region: reviewers can pick one without clicking directly on the globe. */
export interface WizardRegion {
  id: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
  suggestedVariables: ClimateVariable[];
}

// Suggested variables are those backed by real data (GISTEMP and MERRA-2): suggesting a demo-only
// variable would drop a student into a synthetic scenario without asking for one.
export const WIZARD_REGIONS: WizardRegion[] = [
  {
    id: 'arctic',
    label: 'Arctic',
    description: 'Fastest-warming region on the planet',
    lat: 78,
    lng: 15,
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'amazon',
    label: 'Amazon',
    description: 'Earth’s largest tropical rainforest',
    lat: -5,
    lng: -60,
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2Temperature'],
  },
  {
    id: 'sahara',
    label: 'Sahara',
    description: 'The largest hot desert on Earth',
    lat: 23,
    lng: 15,
    suggestedVariables: ['Merra2Temperature', 'Merra2SoilMoisture'],
  },
  {
    id: 'greenland',
    label: 'Greenland',
    description: 'Largest ice reservoir in the Northern Hemisphere',
    lat: 72,
    lng: -40,
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'southasia',
    label: 'South Asia',
    description: 'One of the world’s most populated agricultural regions',
    lat: 25,
    lng: 80,
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2SoilMoisture'],
  },
  {
    id: 'custom',
    label: 'Pick on the globe',
    description: 'Click any point on the globe to select it',
    lat: 0,
    lng: 0,
    suggestedVariables: ['Gistemp'],
  },
];

/** Representative period for trend analysis. */
export interface WizardPeriod {
  id: string;
  label: string;
  description: string;
  startYear: number;
  endYear: number;
}

const THIS_YEAR = new Date().getUTCFullYear();

// "Full record" comes first as the default: the challenge requires a series long enough for
// statistical analysis. The range is trimmed afterward to each source's actual coverage.
export const WIZARD_PERIODS: WizardPeriod[] = [
  {
    id: 'max',
    label: 'Full record',
    description: 'Since 1981 with MERRA-2 and since 2000 with GISTEMP · Longest series',
    startYear: EARLIEST_RECORD_YEAR,
    endYear: THIS_YEAR,
  },
  {
    id: '25y',
    label: 'Since 2000',
    description: '2000 → today · Long enough to detect clear trends',
    startYear: 2000,
    endYear: THIS_YEAR,
  },
  {
    id: '15y',
    label: 'Since 2010',
    description: '2010 → today · Recent trends',
    startYear: 2010,
    endYear: THIS_YEAR,
  },
  {
    id: '10y',
    label: 'Since 2015',
    description: '2015 → today · Changes over the last decade',
    startYear: 2015,
    endYear: THIS_YEAR,
  },
];
