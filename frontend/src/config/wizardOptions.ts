/**
 * Options for the "Trend Detective" wizard: starting regions and analysis periods.
 * Kept separate from glossary.ts so neither file exceeds the CI line limit.
 */
import type { ClimateVariable } from '../types/climate.types';
import type { AnalysisArea } from '../types/globe.types';
import type { SelectedLocation } from '../hooks/useImmersiveUi';
import { EARLIEST_RECORD_YEAR } from './climateLayers';

/** Preset region: reviewers can pick one without clicking directly on the globe. */
export interface WizardRegion {
  id: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
  /** Approximate box of the whole region: centre and half-sizes in degrees. A rectangle, not its real outline. */
  box: { lat: number; lng: number; latRadius: number; lngRadius: number } | null;
  suggestedVariables: ClimateVariable[];
}

export type RegionScope = 'region' | 'point';

// Suggested variables are the long reanalysis and temperature records (GISTEMP and MERRA-2), which
// cover every suggested region; satellite products such as OCO-2 have no series under persistent cloud.
export const WIZARD_REGIONS: WizardRegion[] = [
  {
    id: 'arctic',
    label: 'Arctic',
    description: 'Fastest-warming region on the planet',
    lat: 78,
    lng: 15,
    box: { lat: 78.25, lng: 0, latRadius: 11.75, lngRadius: 180 }, // 66.5°N to the pole, all the way round
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'amazon',
    label: 'Amazon',
    description: 'Earth’s largest tropical rainforest',
    lat: -5,
    lng: -60,
    box: { lat: -5, lng: -62.5, latRadius: 10, lngRadius: 12.5 }, // 15°S–5°N, 75°W–50°W
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2Temperature'],
  },
  {
    id: 'sahara',
    label: 'Sahara',
    description: 'The largest hot desert on Earth',
    lat: 23,
    lng: 15,
    box: { lat: 22.5, lng: 10, latRadius: 7.5, lngRadius: 25 }, // 15°N–30°N, 15°W–35°E
    suggestedVariables: ['Merra2Temperature', 'Merra2SoilMoisture'],
  },
  {
    id: 'greenland',
    label: 'Greenland',
    description: 'Largest ice reservoir in the Northern Hemisphere',
    lat: 72,
    lng: -40,
    box: { lat: 71.5, lng: -40, latRadius: 11.5, lngRadius: 20 }, // 60°N–83°N, 60°W–20°W
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'southasia',
    label: 'South Asia',
    description: 'One of the world’s most populated agricultural regions',
    lat: 25,
    lng: 80,
    box: { lat: 21.5, lng: 80, latRadius: 13.5, lngRadius: 12 }, // 8°N–35°N, 68°E–92°E
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2SoilMoisture'],
  },
  {
    // A city, not a region: it has no box and is always analysed as a point.
    id: 'neiva',
    label: 'Neiva, Huila',
    description: 'City on the upper Magdalena, Colombia · where this project was built',
    lat: 2.93,
    lng: -75.28,
    box: null,
    suggestedVariables: ['Merra2Temperature', 'Merra2Precipitation', 'GpmPrecipitation'],
  },
  {
    id: 'custom',
    label: 'Pick on the globe',
    description: 'Click any point on the globe to select it',
    lat: 0,
    lng: 0,
    box: null,
    suggestedVariables: ['Gistemp'],
  },
];

/** Half-size, in degrees, of the box analysed around a single point. */
export const POINT_RADIUS_DEGREES = 1;

/** The location an answer of the briefing stands for: the whole box of the region, or its reference point. */
export function regionLocation(region: WizardRegion, scope: RegionScope): SelectedLocation {
  return scope === 'region' && region.box
    ? { lat: region.box.lat, lng: region.box.lng, regionId: region.id, latRadius: region.box.latRadius, lngRadius: region.box.lngRadius }
    : { lat: region.lat, lng: region.lng, regionId: region.id };
}

/** Preset region whose box contains the point, to name a place picked on the globe. */
export function regionContaining(lat: number, lng: number): WizardRegion | null {
  return WIZARD_REGIONS.find(({ box }) => box !== null
    && Math.abs(lat - box.lat) <= box.latRadius && Math.abs(lng - box.lng) <= box.lngRadius) ?? null;
}

export function isWholeRegion(location: SelectedLocation): location is SelectedLocation & { latRadius: number; lngRadius: number } {
  return location.latRadius !== undefined && location.lngRadius !== undefined;
}

/** The box drawn on the globe for a location: its region, or 2° around the point. */
export function analysisAreaOf(location: SelectedLocation): AnalysisArea {
  return isWholeRegion(location)
    ? { lat: location.lat, lng: location.lng, latRadius: location.latRadius, lngRadius: location.lngRadius, point: false }
    : { lat: location.lat, lng: location.lng, latRadius: POINT_RADIUS_DEGREES, lngRadius: POINT_RADIUS_DEGREES, point: true };
}

/** Camera altitude, in globe radii, that frames a location: closer for a point, further back for a wide region. */
export function framingAltitude(location: SelectedLocation, pointAltitude: number): number {
  if (!isWholeRegion(location)) return pointAltitude;
  const widest = Math.max(location.latRadius, location.lngRadius * Math.cos(location.lat * Math.PI / 180));
  return Math.min(2.2, 0.5 + widest / 14);
}

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
