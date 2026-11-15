/**
 * How much the 3D scene asks of the machine. On a laptop without a dedicated graphics card the full
 * scene was unusable: measured in a browser rendering by software at 1366x768 with the CPU slowed 4x,
 * it ran at 5 frames per second and blocked the page for 136 seconds in long tasks. The "lite" profile
 * keeps every piece of data and drops what only decorates.
 *
 * The profile is chosen once per page load: asked for in the URL (?quality=lite or ?quality=full),
 * remembered from a manual choice, or guessed from the hardware. If a machine judged capable turns out
 * slow, the frame governor switches it to lite on its own.
 */
export type RenderQuality = 'full' | 'lite';
export type QualityReason = 'manual' | 'weak-graphics' | 'low-memory' | 'few-cores' | 'slow-frames' | 'capable';

export interface QualityState { quality: RenderQuality; reason: QualityReason }

export interface QualityProfile {
  /** Multisampling multiplies the cost of every pixel when there is no graphics card. */
  antialias: boolean;
  maxPixelRatio: number;
  /** Satellite imagery tiles requested from NASA GIBS as the camera approaches: network and memory. */
  detailTiles: boolean;
  /** Relief shading and the 4K/8K textures. */
  surfaceDetail: boolean;
  clouds: boolean;
  /** Milky Way, Sun glare and Moon: a full-screen textured sphere plus extra textures to download. */
  celestial: boolean;
  /** Four 3D models (about 2 MB) and their decoder. */
  satellites: boolean;
  /** Stop drawing when nothing moves, and lower the resolution if frames are still slow. */
  frameGovernor: boolean;
}

export const QUALITY_PROFILES: Record<RenderQuality, QualityProfile> = {
  full: { antialias: true, maxPixelRatio: 2, detailTiles: true, surfaceDetail: true, clouds: true,
    celestial: true, satellites: true, frameGovernor: false },
  lite: { antialias: false, maxPixelRatio: 1, detailTiles: false, surfaceDetail: false, clouds: false,
    celestial: false, satellites: false, frameGovernor: true },
};

const STORAGE_KEY = 'earth.renderQuality';
/** Software renderers and integrated chips. Intel Arc is a dedicated card and is left out. */
const WEAK_GRAPHICS = /swiftshader|llvmpipe|software|basic render|intel(?!.*\barc\b)|mali|adreno|powervr|videocore/i;

function graphicsName(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return 'software';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return '';
  }
}

function stored(): RenderQuality | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'lite' || value === 'full' ? value : null;
  } catch {
    return null;
  }
}

function detect(): QualityState {
  const requested = new URLSearchParams(window.location.search).get('quality');
  if (requested === 'lite' || requested === 'full') return { quality: requested, reason: 'manual' };
  const remembered = stored();
  if (remembered) return { quality: remembered, reason: 'manual' };
  if (WEAK_GRAPHICS.test(graphicsName())) return { quality: 'lite', reason: 'weak-graphics' };
  const device = navigator as Navigator & { deviceMemory?: number };
  if (device.deviceMemory !== undefined && device.deviceMemory <= 4) return { quality: 'lite', reason: 'low-memory' };
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return { quality: 'lite', reason: 'few-cores' };
  return { quality: 'full', reason: 'capable' };
}

let state: QualityState = detect();
const listeners = new Set<() => void>();
document.documentElement.dataset.quality = state.quality;

export const getRenderQuality = (): QualityState => state;

export function subscribeRenderQuality(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** A manual choice is remembered on this device; an automatic downgrade only lasts for the visit. */
export function setRenderQuality(quality: RenderQuality, reason: QualityReason = 'manual'): void {
  if (quality === state.quality && reason === state.reason) return;
  state = { quality, reason };
  document.documentElement.dataset.quality = quality;
  if (reason === 'manual') {
    try { window.localStorage.setItem(STORAGE_KEY, quality); } catch { /* private mode: the choice lasts for the visit */ }
  }
  listeners.forEach(listener => listener());
}
