/**
 * Misiones cuyos datos usa la plataforma, con parámetros orbitales nominales publicados por la NASA
 * (páginas de misión de Terra, Aqua, OCO-2 y GRACE-FO). Lo que es ilustrativo se dice aquí:
 *
 * - La altitud se exagera (EARTH_SATELLITE_CONFIG.altitudeExaggeration) para que las órbitas se vean;
 *   a escala real 705 km son el 11 % del radio y los satélites rozarían la superficie.
 * - El tiempo se acelera (timeScale): una vuelta real dura ~99 min.
 * - El modelo 3D es genérico (cuerpo con lámina dorada y alas solares), no el de cada misión.
 * - Terra, Aqua y OCO-2 son heliosíncronos: su plano se orienta según la hora local de cruce del
 *   ecuador respecto al sol real de la escena. GRACE-FO no lo es; su nodo es ilustrativo.
 */
export interface SatelliteMission {
  id: string;
  name: string;
  altitudeKm: number;
  inclinationDeg: number;
  periodMin: number;
  /** Hora solar local del nodo ascendente (heliosíncronos); null = nodo ilustrativo. */
  ascendingNodeLocalTime: number | null;
  /** Desfase del nodo respecto al punto subsolar cuando no es heliosíncrono, en grados. */
  illustrativeNodeOffsetDeg?: number;
  /** Fase inicial sobre la órbita (radianes): reparte los satélites. */
  phase: number;
  accent: string;
  /** Mitad del ancho de barrido dibujado, en radios terrestres (orientativo). */
  swathHalfWidth: number;
  /** Modelo oficial de NASA-3D-Resources en public/models/satellites/. */
  model: 'terra' | 'aqua' | 'oco2' | 'grace';
}

export const SATELLITE_MISSIONS: SatelliteMission[] = [
  // Terra: nodo descendente 10:30 → ascendente 22:30. MODIS barre 2.330 km.
  { id: 'terra', name: 'Terra · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.9,
    ascendingNodeLocalTime: 22.5, phase: 0.4, accent: '#4ade80', swathHalfWidth: 0.11, model: 'terra' },
  { id: 'aqua', name: 'Aqua · MODIS', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.5, phase: 2.2, accent: '#22d3ee', swathHalfWidth: 0.11, model: 'aqua' },
  { id: 'oco2', name: 'OCO-2 · CO₂', altitudeKm: 705, inclinationDeg: 98.2, periodMin: 98.8,
    ascendingNodeLocalTime: 13.6, phase: 3.6, accent: '#fb923c', swathHalfWidth: 0.05, model: 'oco2' },
  // Se dibuja con el modelo de GRACE (2002-2017), su predecesora casi idéntica: la NASA no publica GRACE-FO.
  { id: 'grace-fo', name: 'GRACE-FO · masa de agua', altitudeKm: 490, inclinationDeg: 89, periodMin: 94.5,
    ascendingNodeLocalTime: null, illustrativeNodeOffsetDeg: 75, phase: 5.1, accent: '#e879f9', swathHalfWidth: 0.07,
    model: 'grace' },
];

export const EARTH_SATELLITE_CONFIG = {
  altitudeExaggeration: 3,
  /** 90× => una vuelta en poco más de un minuto. */
  timeScale: 90,
  /** Escala del satélite procedural de respaldo (mientras carga el modelo o si falla). */
  modelScale: 3.2,
  /** Dimensión máxima del modelo NASA en unidades de escena (radio terrestre = 100). */
  gltfSize: 24,
  orbitDots: 240,
  trailDegrees: 28,
} as const;
