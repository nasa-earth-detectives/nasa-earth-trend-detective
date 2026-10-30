import { EARTH_ASSETS } from '../components/Globe/earthConfig';
import type { ClimateObservation } from '../types/climate.types';

/**
 * Máscara de agua MODIS que ya usa el material del globo (255 = agua, 0 = tierra; Antártida y
 * Groenlandia son tierra). Usar la misma imagen garantiza que las columnas "de tierra" caen sobre
 * los continentes que se ven, no sobre una costa de otra fuente. 1024×512 ≈ 0,35°/px: de sobra
 * para decidir celdas de 2°.
 */
export interface LandMask {
  /** Fracción de tierra (0-1) de una celda cuadrada centrada en lat/lon. */
  landFraction(latitude: number, longitude: number, sizeDegrees: number): number;
}

/** Una celda costera cuenta como tierra si al menos la mitad de su superficie lo es. */
const LAND_THRESHOLD = 0.5;
/** 5×5 muestras por celda: con 2° y 0,35°/px recorre unos 6 píxeles por lado. */
const SAMPLES = 5;

let maskPromise: Promise<LandMask> | null = null;

function decode(image: HTMLImageElement): LandMask {
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('El navegador no permite leer la máscara de tierra.');
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

/** Se carga una vez (44 KB) y se reutiliza; si falla, se reintenta en la siguiente llamada. */
export function loadLandMask(): Promise<LandMask> {
  if (maskPromise) return maskPromise;
  maskPromise = new Promise<LandMask>((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      try { resolve(decode(image)); } catch (error) { reject(error); }
    };
    image.onerror = () => reject(new Error('No se pudo cargar la máscara de tierra.'));
    image.src = EARTH_ASSETS.waterMask.mobile;
  }).catch((error: unknown) => {
    maskPromise = null;
    throw error;
  });
  return maskPromise;
}

/** Deja solo las celdas mayoritariamente terrestres. No altera ningún valor. */
export function filterLandCells(observations: ClimateObservation[], mask: LandMask,
  cellDegrees: number): ClimateObservation[] {
  return observations.filter(observation =>
    mask.landFraction(observation.latitude, observation.longitude, cellDegrees) >= LAND_THRESHOLD);
}
