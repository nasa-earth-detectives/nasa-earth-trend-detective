/**
 * How the 3D scene is drawn on this machine. What is drawn is the same in every profile: the planet,
 * its clouds and atmosphere, the sky and the satellites are part of the design and are never dropped.
 *
 * On a laptop without a dedicated graphics card the scene was unusable: measured in a browser
 * rendering by software at 1366x768 with the CPU slowed 4x, it drew 5 frames per second and blocked the
 * page for 22 seconds before anyone touched it. More than half of each frame (118 of 204 ms) was
 * hardware multisampling; clouds, atmosphere and sky together were a small part. So the profiles change
 * when and with how many pixels the scene is drawn (see frameGovernor.ts), not its content:
 *
 *  - full: every frame, multisampled. For dedicated graphics cards.
 *  - adaptive: multisampled, drawn at the pace the machine can hold: every frame if it proves fast,
 *    fewer pixels while the camera moves and fewer pictures a second at rest if it proves slow. For
 *    integrated chips, where multisampling is cheap.
 *  - lean: the same pacing without multisampling; a picture in which nothing moves is supersampled
 *    instead. For software rendering, where multisampling more than doubles every frame, and for any
 *    machine that proved too slow in another profile.
 *
 * The profile is chosen once per page load: asked for in the URL (?quality=full|adaptive|lean),
 * remembered from a manual choice, or guessed from the hardware. The frame governor moves a machine
 * that cannot keep up to lean on its own.
 */
export type RenderQuality = 'full' | 'adaptive' | 'lean';
export type QualityReason = 'manual' | 'software-graphics' | 'integrated-graphics' | 'low-memory' | 'few-cores'
  | 'slow-frames' | 'capable';

export interface QualityState { quality: RenderQuality; reason: QualityReason }

export interface QualityProfile {
  /** Hardware multisampling. Without a graphics card it more than doubles the cost of every frame. */
  antialias: boolean;
  /** Draw at the pace the machine can hold: fewer pixels while the camera moves, fewer pictures a second at rest. */
  adaptiveFrames: boolean;
  /** Keep drawing every frame (orbits and ripples stay alive) for as long as the machine does it fast. */
  liveWhenFast: boolean;
  /**
   * Sharpness of the resting picture, in screen pixels per side. 2 draws the still globe with four
   * samples per pixel, which smooths edges as multisampling did, at the cost of a single slower frame.
   */
  restSupersampling: number;
  /** The 8K day texture requested after zooming in: 4.25 MB to download and about 170 MB of video memory. */
  detailUpgrade: boolean;
}

export const QUALITY_PROFILES: Record<RenderQuality, QualityProfile> = {
  full: { antialias: true, adaptiveFrames: false, liveWhenFast: false, restSupersampling: 1, detailUpgrade: true },
  adaptive: { antialias: true, adaptiveFrames: true, liveWhenFast: true, restSupersampling: 1, detailUpgrade: false },
  lean: { antialias: false, adaptiveFrames: true, liveWhenFast: false, restSupersampling: 2, detailUpgrade: false },
};

const STORAGE_KEY = 'earth.renderQuality';
const SOFTWARE_GRAPHICS = /swiftshader|llvmpipe|software|basic render/i;
/** Integrated chips. Intel Arc is a dedicated card and is left out. */
const INTEGRATED_GRAPHICS = /intel(?!.*\barc\b)|mali|adreno|powervr|videocore/i;

const isQuality = (value: string | null): value is RenderQuality =>
  value === 'full' || value === 'adaptive' || value === 'lean';

function readGraphicsName(): string {
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

const graphicsName = readGraphicsName();
const softwareGraphics = SOFTWARE_GRAPHICS.test(graphicsName);

function stored(): RenderQuality | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isQuality(value) ? value : null;
  } catch {
    return null;
  }
}

function detect(): QualityState {
  const requested = new URLSearchParams(window.location.search).get('quality');
  if (isQuality(requested)) return { quality: requested, reason: 'manual' };
  const remembered = stored();
  if (remembered) return { quality: remembered, reason: 'manual' };
  if (softwareGraphics) return { quality: 'lean', reason: 'software-graphics' };
  if (INTEGRATED_GRAPHICS.test(graphicsName)) return { quality: 'adaptive', reason: 'integrated-graphics' };
  const device = navigator as Navigator & { deviceMemory?: number };
  if (device.deviceMemory !== undefined && device.deviceMemory <= 4) return { quality: 'adaptive', reason: 'low-memory' };
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return { quality: 'adaptive', reason: 'few-cores' };
  return { quality: 'full', reason: 'capable' };
}

let state: QualityState = detect();
const listeners = new Set<() => void>();
document.documentElement.dataset.quality = state.quality;

export const getRenderQuality = (): QualityState => state;

/** The on-demand profile that suits the graphics of this machine, for a visitor who switches it on by hand. */
export const onDemandQuality = (): RenderQuality => (softwareGraphics ? 'lean' : 'adaptive');

export function subscribeRenderQuality(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** A manual choice is remembered on this device; an automatic change only lasts for the visit. */
export function setRenderQuality(quality: RenderQuality, reason: QualityReason = 'manual'): void {
  if (quality === state.quality && reason === state.reason) return;
  state = { quality, reason };
  document.documentElement.dataset.quality = quality;
  if (reason === 'manual') {
    try { window.localStorage.setItem(STORAGE_KEY, quality); } catch { /* private mode: the choice lasts for the visit */ }
  }
  listeners.forEach(listener => listener());
}
