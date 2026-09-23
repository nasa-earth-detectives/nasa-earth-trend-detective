import { Color } from 'three';
import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import { getObservationValue, OBSERVATION_SCALES, sampleObservationColor } from '../../utils/colorScales';

export const EARTH_HEAT_CONFIG = {
  width: 512, height: 256, radiusDegrees: 4, opacity: 0.6, transitionMs: 800,
} as const;

export interface HeatRaster {
  /** Filas sur→norte, longitud -180..180. RGB lineal premultiplicado por alfa visual. */
  pixels: Uint8Array;
  values: Float32Array;
  coverage: Float32Array;
  width: number;
  height: number;
}

/** Hace visible la superficie cerca de la referencia; no expresa confianza ni densidad. */
export function observationHeatStrength(variable: ClimateVariable, value: number): number {
  const [minimum, maximum] = OBSERVATION_SCALES[variable].domain;
  if (minimum >= 0) return 1; // NDVI y CO₂ no tienen una referencia cero divergente.
  return 0.15 + 0.85 * Math.min(1, Math.abs(value) / Math.max(Math.abs(minimum), maximum));
}

/** Media espacial firmada: la cantidad de muestras no representa temperatura o biomasa. */
export function rasterizeEarthHeat(
  observations: ClimateObservation[], variable: ClimateVariable,
  width = EARTH_HEAT_CONFIG.width, height = EARTH_HEAT_CONFIG.height,
  radiusDegrees = EARTH_HEAT_CONFIG.radiusDegrees,
): HeatRaster {
  const size = width * height;
  const sums = new Float64Array(size);
  const weights = new Float64Array(size);
  const coverage = new Float32Array(size);
  const values = new Float32Array(size).fill(NaN);
  const pixels = new Uint8Array(size * 4);
  const radians = Math.PI / 180;
  const cosRadius = Math.cos(radiusDegrees * radians);
  const latitudeStep = 180 / height;
  const longitudeStep = 360 / width;
  const sinLatitudes = new Float64Array(height);
  const cosLatitudes = new Float64Array(height);
  for (let row = 0; row < height; row++) {
    const latitude = (-90 + (row + 0.5) * latitudeStep) * radians;
    sinLatitudes[row] = Math.sin(latitude);
    cosLatitudes[row] = Math.cos(latitude);
  }

  // Igualar ubicaciones repetidas impide que duplicar registros cambie su peso espacial.
  const locations = new Map<string, { lat: number; lng: number; sum: number; count: number }>();
  for (const observation of observations) {
    const { latitude: lat, longitude: lng } = observation;
    const value = getObservationValue(observation);
    if (observation.variable !== variable || !Number.isFinite(value)
      || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90) continue;
    const longitude = ((lng + 180) % 360 + 360) % 360 - 180;
    const key = `${lat.toFixed(6)}:${longitude.toFixed(6)}`;
    const existing = locations.get(key);
    if (existing) { existing.sum += value; existing.count++; }
    else locations.set(key, { lat, lng: longitude, sum: value, count: 1 });
  }

  for (const location of locations.values()) {
    const sinLatitude = Math.sin(location.lat * radians);
    const cosLatitude = Math.cos(location.lat * radians);
    const startRow = Math.max(0, Math.ceil((location.lat - radiusDegrees + 90) / latitudeStep - 0.5));
    const endRow = Math.min(height - 1, Math.floor((location.lat + radiusDegrees + 90) / latitudeStep - 0.5));
    for (let row = startRow; row <= endRow; row++) {
      const latitudeProduct = sinLatitude * sinLatitudes[row];
      const cosProduct = cosLatitude * cosLatitudes[row];
      const bound = cosProduct < 1e-12 ? -1 : (cosRadius - latitudeProduct) / cosProduct;
      if (bound > 1) continue;
      const span = Math.acos(Math.max(-1, bound)) / radians;
      const startColumn = Math.ceil((location.lng - span + 180) / longitudeStep - 0.5);
      const endColumn = Math.min(startColumn + width - 1,
        Math.floor((location.lng + span + 180) / longitudeStep - 0.5));
      for (let column = startColumn; column <= endColumn; column++) {
        const longitude = -180 + (column + 0.5) * longitudeStep;
        const cosine = latitudeProduct + cosProduct * Math.cos((longitude - location.lng) * radians);
        if (cosine <= cosRadius) continue;
        const kernel = ((cosine - cosRadius) / (1 - cosRadius)) ** 2;
        const index = row * width + ((column % width) + width) % width;
        sums[index] += location.sum / location.count * kernel;
        weights[index] += kernel;
        coverage[index] = Math.max(coverage[index], Math.min(1, kernel * 2));
      }
    }
  }

  const color = new Color();
  for (let index = 0; index < size; index++) {
    if (weights[index] <= 0) continue;
    const value = sums[index] / weights[index];
    values[index] = value;
    sampleObservationColor(variable, value, color);
    const alpha = coverage[index] * observationHeatStrength(variable, value);
    const offset = index * 4;
    pixels[offset] = Math.round(color.r * alpha * 255);
    pixels[offset + 1] = Math.round(color.g * alpha * 255);
    pixels[offset + 2] = Math.round(color.b * alpha * 255);
    pixels[offset + 3] = Math.round(alpha * 255);
  }
  return { pixels, values, coverage, width, height };
}
