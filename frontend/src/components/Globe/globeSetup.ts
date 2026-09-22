/**
 * Utilidades puras de configuración de la escena.
 *
 * Se mantienen fuera de `useGlobeScene` para que el hook conserve un tamaño
 * legible y para poder razonar sobre el encuadre de forma aislada.
 */
import type { GlobeInstance } from 'globe.gl';
import { PerspectiveCamera } from 'three';
import { GLOBE_CONFIG } from './globeConfig';

/**
 * Amplía el plano lejano de la cámara para que el cascarón de estrellas quede
 * dentro del frustum, sin depender del valor por defecto de la librería.
 */
export function extendCameraFarPlane(globe: GlobeInstance): void {
  const camera = globe.camera();

  if (camera instanceof PerspectiveCamera) {
    const required = GLOBE_CONFIG.starOuterRadius * 2.5;

    if (camera.far < required) {
      camera.far = required;
      camera.updateProjectionMatrix();
    }
  }
}

/**
 * Desplaza el encuadre de la escena sin mover el lienzo ni recrear nada.
 *
 * Usa `setViewOffset` de la cámara: la proyección se desplaza para dejar
 * sitio al instrumento lateral o a la hoja móvil, mientras el
 * campo estelar sigue cubriendo todo el viewport.
 */
export function createFocusOffsetController(globe: GlobeInstance, container: HTMLElement) {
  type Offset = [number, number];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current: Offset = [0, 0];
  let target: Offset = [0, 0];
  let requested: Offset = [0, 0];
  let origin: Offset = [0, 0];
  let startedAt = 0;
  let frame: number | undefined;

  const constrain = ([x, y]: Offset): Offset => {
    const mobile = container.clientWidth < 1024;
    const limit = mobile ? Math.min(180, container.clientHeight * 0.18)
      : Math.min(210, container.clientWidth * 0.14);
    const value = mobile ? y : x;
    const bounded = Math.max(-limit, Math.min(limit, value));
    return mobile ? [0, bounded] : [bounded, 0];
  };

  const apply = ([x, y]: Offset): void => {
    const camera = globe.camera();
    if (!(camera instanceof PerspectiveCamera)) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;

    if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) {
      camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(clientWidth, clientHeight, -x, -y, clientWidth, clientHeight);
  };

  // Duración temporal constante a 60/120 Hz; nunca actualiza estado de React.
  const step = (now: number): void => {
    const progress = Math.min(1, (now - startedAt) / GLOBE_CONFIG.focusOffsetMs);
    const eased = 1 - Math.pow(1 - progress, 3);
    current = [origin[0] + (target[0] - origin[0]) * eased,
      origin[1] + (target[1] - origin[1]) * eased];
    apply(current);
    frame = progress < 1 ? requestAnimationFrame(step) : undefined;
  };

  const update = (): void => {
    current = constrain(current);
    const next = constrain(requested);
    if (reducedMotion.matches) {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = undefined;
      current = target = next;
      apply(current);
      return;
    }
    if (next[0] === target[0] && next[1] === target[1]) {
      apply(current);
      return;
    }
    if (frame !== undefined) cancelAnimationFrame(frame);
    origin = current;
    target = next;
    startedAt = performance.now();
    frame = requestAnimationFrame(step);
  };
  reducedMotion.addEventListener('change', update);

  return {
    set(offsetPx: number, verticalOffsetPx = 0): void {
      requested = [Number.isFinite(offsetPx) ? offsetPx : 0,
        Number.isFinite(verticalOffsetPx) ? verticalOffsetPx : 0];
      update();
    },
    reapply(): void {
      update();
    },
    dispose(): void {
      if (frame !== undefined) cancelAnimationFrame(frame);
      reducedMotion.removeEventListener('change', update);
    },
  };
}

/** Compensa el campo vertical en móvil y da algo más de presencia en panorámico. */
export function resolveInitialAltitude(width: number, height: number): number {
  if (width === 0 || height === 0) return GLOBE_CONFIG.initialAltitude;

  const aspect = width / height;
  if (aspect >= GLOBE_CONFIG.referenceAspect) {
    const wideProgress = Math.min(1, (aspect - GLOBE_CONFIG.referenceAspect) / 0.3);
    return GLOBE_CONFIG.initialAltitude +
      (GLOBE_CONFIG.wideInitialAltitude - GLOBE_CONFIG.initialAltitude) * wideProgress;
  }

  const boost = GLOBE_CONFIG.referenceAspect / Math.max(aspect, GLOBE_CONFIG.minAspect);

  return Math.min(GLOBE_CONFIG.initialAltitude * boost, GLOBE_CONFIG.maxInitialAltitude);
}
