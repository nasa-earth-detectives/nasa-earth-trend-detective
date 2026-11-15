import { EARTH_ASSETS } from '../components/Globe/earthConfig';
import type { ClimateObservation } from '../types/climate.types';

/**
 * MODIS water mask already used by the globe material (255 = water, 0 = land; Antarctica
 * and Greenland are land). Using the same image ensures that "land" columns align with
 * visible continents, not a coastline from a different source. 1024×512 ≈ 0.35°/px: plenty
 * to resolve 2° cells.
 */
export interface LandMask {
  /** Land fraction (0-1) of a square cell centered at lat/lon. */
  landFraction(latitude: number, longitude: number, sizeDegrees: number): number;
}

/** A coastal cell counts as land if at least half its area is land. */
const LAND_THRESHOLD = 0.5;
/** 5×5 samples per cell: with 2° and 0.35°/px covers about 6 pixels per side. */
const SAMPLES = 5;

let maskPromise: Promise<LandMask> | null = null;

function decode(image: HTMLImageElement): LandMask {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Browser canvas cannot read land mask.');
  context.drawImage(image, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  const isLand = (latitude: number, longitude: number) => {
    const x = Math.floor((((longitude + 180) % 360 + 360) % 360) / 360 * width) % width;
    const y = Math.min(height - 1, Math.max(0, Math.floor((90 - latitude) / 180 * height)));
    return data[(y * width + x) * 4] < 128;
  };
  return {
    landFraction(latitude, longitude, sizeDegrees) {
      let land = 0;
      for (let i = 0; i < SAMPLES; i += 1) {
        for (let j = 0; j < SAMPLES; j += 1) {
          const lat = latitude + ((i + 0.5) / SAMPLES - 0.5) * sizeDegrees;
          const lon = longitude + ((j + 0.5) / SAMPLES - 0.5) * sizeDegrees;
          if (isLand(Math.max(-90, Math.min(90, lat)), lon)) land += 1;
        }
      }
      return land / (SAMPLES * SAMPLES);
    },
  };
}

/** Loaded once (44 KB) and reused; if it fails, it retries on the next call. */
export function loadLandMask(): Promise<LandMask> {
  if (maskPromise) return maskPromise;
  maskPromise = new Promise<LandMask>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try { resolve(decode(image)); } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('Failed to load land mask.'));
    image.src = EARTH_ASSETS.waterMask.mobile;
  }).catch((error: unknown) => {
    maskPromise = null;
    throw error;
  });
  return maskPromise;
}

/** Retains only predominantly land cells. Does not alter any values. */
export function filterLandCells(observations: ClimateObservation[], mask: LandMask,
  cellDegrees: number): ClimateObservation[] {
  return observations.filter(observation =>
    mask.landFraction(observation.latitude, observation.longitude, cellDegrees) >= LAND_THRESHOLD);
}
