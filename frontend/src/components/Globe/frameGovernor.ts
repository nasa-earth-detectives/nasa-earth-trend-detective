import type { GlobeInstance } from 'globe.gl';
import type { WebGLRenderer } from 'three';

/** Without activity for this long, the scene stops drawing until something happens. */
const IDLE_MS = 3000;
/** Frames are averaged over windows of this length. */
const WINDOW_MS = 2000;
/** The first windows include texture uploads and shader compilation: they say nothing about steady speed. */
const WARMUP_MS = 5000;
const SLOW_FPS = 22;
const MIN_SCALE = 0.5;

interface FrameGovernorOptions {
  /** Pixel ratio the scene would use at full resolution. */
  basePixelRatio: () => number;
  /** Stop drawing when idle and lower the resolution when slow (lite profile). */
  manage: boolean;
  /** Something keeps the scene moving on its own (auto-rotation): never pause. */
  isAnimating: () => boolean;
  /** Called once if a scene that is not managed stays slow: the caller switches to the lite profile. */
  onTooSlow?: () => void;
}

/**
 * Keeps a weak machine responsive. Globe.gl draws every frame whether or not anything changed; on a
 * laptop without a graphics card each frame took about 200 ms of the main thread, so the page could
 * not answer a click. Managed scenes draw only while something is happening and, if frames are still
 * slow, render at a lower resolution. Unmanaged scenes are only watched, to detect a machine that was
 * judged capable and is not.
 */
export function createFrameGovernor(globe: GlobeInstance, renderer: WebGLRenderer, container: HTMLElement,
  options: FrameGovernorOptions) {
  let scale = 1;
  let paused = false;
  let frame = 0;
  let frames = 0;
  let slowWindows = 0;
  let reported = false;
  let disposed = false;
  const startedAt = performance.now();
  let windowStart = startedAt;
  let lastActivity = startedAt;

  const applyPixelRatio = (): void => {
    const next = options.basePixelRatio() * scale;
    if (Math.abs(renderer.getPixelRatio() - next) > 0.01) {
      renderer.setPixelRatio(next);
      globe.width(container.clientWidth).height(container.clientHeight);
    }
  };

  const wake = (): void => {
    lastActivity = performance.now();
    if (!paused || disposed) return;
    paused = false;
    windowStart = lastActivity;
    frames = 0;
    globe.resumeAnimation();
  };

  const tick = (now: number): void => {
    frame = requestAnimationFrame(tick);
    if (paused) return;
    frames += 1;
    if (now - windowStart >= WINDOW_MS) {
      const fps = frames * 1000 / (now - windowStart);
      // A window much longer than planned means the tab was hidden or the machine slept: not a slow scene.
      const interrupted = now - windowStart > WINDOW_MS * 3;
      windowStart = now;
      frames = 0;
      if (interrupted) return;
      if (now - startedAt > WARMUP_MS && fps < SLOW_FPS) {
        slowWindows += 1;
        if (options.manage && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.8);
          applyPixelRatio();
        } else if (!options.manage && slowWindows >= 2 && !reported) {
          reported = true;
          options.onTooSlow?.();
        }
      } else {
        slowWindows = 0;
      }
    }
    if (options.manage && now - lastActivity > IDLE_MS && !options.isAnimating()) {
      paused = true;
      globe.pauseAnimation();
    }
  };

  const events: Array<keyof WindowEventMap> = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'touchstart', 'resize'];
  events.forEach(name => window.addEventListener(name, wake, { passive: true }));
  globe.controls().addEventListener('change', wake);
  applyPixelRatio();
  frame = requestAnimationFrame(tick);

  return {
    /** Anything that changes what is on screen (new data, a camera move, a texture that arrived) calls this. */
    wake,
    applyPixelRatio,
    dispose(): void {
      disposed = true;
      cancelAnimationFrame(frame);
      events.forEach(name => window.removeEventListener(name, wake));
      globe.controls().removeEventListener('change', wake);
    },
  };
}
