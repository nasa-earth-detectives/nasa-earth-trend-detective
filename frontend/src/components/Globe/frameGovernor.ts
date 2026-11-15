import type { GlobeInstance } from 'globe.gl';
import type { WebGLRenderer } from 'three';
import {
  FAST_FPS, LIVELY_FLOOR_FPS, LIVELY_TRIALS, MAX_REFINED_PIXELS, MAX_REFINED_RATIO, MIN_MOTION_SCALE,
  MOTION_WINDOW_MS, REFINE_MS, REFRESH_INTERVAL_MS, RESIZE_HOLD_MS, SCALE_STEP, SETTLE_MS, SLOW_FPS,
  TRANSITION_MS, VISIBLE_ANGLE, WARMUP_MS, WATCH_WINDOW_MS, type FrameGovernorOptions,
} from './frameGovernorConfig';
import { registerSceneFrames } from './sceneFrames';
import { createAmbientFrames } from './ambientFrames';

/**
 * Decides when the globe is drawn and with how many pixels, without changing what is drawn.
 *
 * Globe.gl draws every frame at full cost. Measured in a browser rendering by software (1366x768, CPU
 * slowed 4x) the complete scene took 204 ms per frame, 118 of them in hardware multisampling: at 5
 * frames per second the page cannot answer a click. A managed scene keeps every visual element and:
 *  - while the camera moves, lowers the resolution as far as the frame rate needs (never below half);
 *  - when it stops, goes back to full resolution and keeps drawing what moves with the clock
 *    (satellites, ripples, arcs) at the pace the machine can hold (see ambientFrames.ts);
 *  - only where nothing moves on its own does it stop and, where multisampling is off, replace the
 *    still picture with a supersampled one.
 * Where the machine proves fast, a scene allowed to stay alive never rests at all.
 *
 * Speed is judged in quiet windows, just before the scene would rest: windows measured while the page
 * loads or the camera moves mix in work that says nothing about the machine. A change of profile
 * rebuilds the scene, so it is only asked for while nothing moves, never in the middle of a drag.
 */
export function createFrameGovernor(globe: GlobeInstance, renderer: WebGLRenderer, options: FrameGovernorOptions) {
  const controls = globe.controls();
  const camera = globe.camera();
  const lastPosition = camera.position.clone();
  const startedAt = performance.now();
  let phase: 'moving' | 'resting' | 'refined' = 'moving';
  // A scene with no hope of staying alive starts at the lowest motion resolution and earns its way up:
  // while the page loads nothing on screen is final, and every frame saved is time for the data to arrive.
  let motionScale = options.manage && !options.liveWhenFast ? MIN_MOTION_SCALE : 1;
  let motionUntil = startedAt + TRANSITION_MS;
  let lively = false;
  let trial: 'none' | 'full' | 'half' = 'none';
  let trialsLeft = options.liveWhenFast ? LIVELY_TRIALS : 0;
  let triedSinceLastMove = false;
  let windowStart = startedAt;
  let frames = 0;
  let slowWindows = 0;
  let tooSlow = false;
  let reported = false;
  let disposed = false;
  let frame = 0;
  let refreshFrame = 0;
  let refreshTimer: ReturnType<typeof setTimeout> | undefined;
  let lastRefresh = 0;
  let refineTimer: ReturnType<typeof setTimeout> | undefined;
  let lastMotionFps = 0;

  const screenRatio = (): number => options.devicePixelRatio();
  const refinedRatio = (): number => {
    const canvas = renderer.domElement;
    const fits = Math.sqrt(MAX_REFINED_PIXELS / Math.max(1, canvas.clientWidth * canvas.clientHeight));
    return Math.max(screenRatio(), Math.min(MAX_REFINED_RATIO, screenRatio() * options.restSupersampling, fits));
  };
  const motionRatio = (): number => screenRatio() * (options.manage ? motionScale : 1);

  /** Changing the ratio empties the canvas, so whoever changes it draws again in the same task. */
  const setRatio = (ratio: number): boolean => {
    if (Math.abs(renderer.getPixelRatio() - ratio) < 0.01) return false;
    renderer.setPixelRatio(ratio);
    return true;
  };
  const draw = (): void => { globe.postProcessingComposer().render(); };
  /** A machine that moves the full picture this fast can afford the sharpest one without an intermediate step. */
  const quick = (): boolean => motionScale === 1 && lastMotionFps > FAST_FPS;
  const ambient = createAmbientFrames(draw, globe.scene());

  const refine = (): void => {
    if (disposed || phase === 'moving') return;
    phase = 'refined';
    if (setRatio(refinedRatio())) draw();
  };

  const rest = (): void => {
    phase = 'resting';
    cancelAnimationFrame(frame);
    frame = 0;
    globe.pauseAnimation();
    if (options.keepsMoving()) {
      if (setRatio(screenRatio())) draw();
      ambient.start();
      return;
    }
    if (quick()) { refine(); return; }
    if (setRatio(screenRatio())) draw();
    clearTimeout(refineTimer);
    refineTimer = setTimeout(refine, REFINE_MS);
  };

  /** A quiet window at a fixed resolution: `full` to see if the scene can stay alive, `half` to see if this profile is enough. */
  const startTrial = (kind: 'full' | 'half', now: number): void => {
    trial = kind;
    motionScale = kind === 'full' ? 1 : MIN_MOTION_SCALE;
    if (setRatio(motionRatio())) draw();
    windowStart = now;
    frames = 0;
    motionUntil = now + MOTION_WINDOW_MS + 2 * 17;
  };

  const judgeTrial = (framesPerSecond: number, now: number): void => {
    const kind = trial;
    trial = 'none';
    if (kind === 'full') {
      if (framesPerSecond > FAST_FPS) lively = true;
      else if (framesPerSecond < SLOW_FPS) startTrial('half', now);
      return;
    }
    // Slow even at half resolution with nothing moving: multisampling is all that is left to give up.
    if (framesPerSecond < SLOW_FPS && now - startedAt > WARMUP_MS) tooSlow = true;
  };

  const judge = (framesPerSecond: number, now: number): void => {
    if (!options.manage) {
      slowWindows = now - startedAt > WARMUP_MS && framesPerSecond < SLOW_FPS ? slowWindows + 1 : 0;
      if (slowWindows >= 2) tooSlow = true;
      return;
    }
    lastMotionFps = framesPerSecond;
    options.onMotionRate?.(framesPerSecond);
    if (trial !== 'none') { judgeTrial(framesPerSecond, now); return; }
    if (options.liveWhenFast) {
      if (motionScale === 1 && framesPerSecond > FAST_FPS) lively = true;
      else if (motionScale < 1 || framesPerSecond < LIVELY_FLOOR_FPS) lively = false;
      const stuck = motionScale === MIN_MOTION_SCALE && framesPerSecond < SLOW_FPS && now - startedAt > WARMUP_MS;
      slowWindows = stuck ? slowWindows + 1 : 0;
      if (slowWindows >= 2) tooSlow = true;
    }
    const next = framesPerSecond < SLOW_FPS ? Math.max(MIN_MOTION_SCALE, motionScale * SCALE_STEP)
      : framesPerSecond > FAST_FPS ? Math.min(1, motionScale / SCALE_STEP) : motionScale;
    if (next === motionScale) return;
    motionScale = next;
    if (setRatio(motionRatio())) draw();
  };

  const tick = (now: number): void => {
    frame = requestAnimationFrame(tick);
    frames += 1;
    const elapsed = now - windowStart;
    const length = options.manage ? MOTION_WINDOW_MS : WATCH_WINDOW_MS;
    if (elapsed >= length) {
      const framesPerSecond = frames * 1000 / elapsed;
      windowStart = now;
      frames = 0;
      // A window much longer than planned means the tab was hidden or the machine slept: not a slow scene.
      if (elapsed <= length * 3) judge(framesPerSecond, now);
      else trial = 'none';
    }
    if (now < motionUntil || options.isAnimating()) return;
    // Nothing is moving: the moment to change profile, to try a quiet window, or to rest.
    if (tooSlow && !reported) { reported = true; options.onTooSlow?.(); return; }
    if (!options.manage || lively || trial !== 'none') return;
    if (trialsLeft > 0 && !triedSinceLastMove) { triedSinceLastMove = true; trialsLeft -= 1; startTrial('full', now); return; }
    rest();
  };

  /** The picture is moving, or about to: draw continuously for at least `holdMs` more. */
  const move = (holdMs: number): void => {
    const now = performance.now();
    motionUntil = Math.max(motionUntil, now + holdMs);
    trial = 'none';
    triedSinceLastMove = false;
    if (!options.manage || disposed || phase === 'moving') return;
    ambient.stop();
    clearTimeout(refineTimer);
    clearTimeout(refreshTimer);
    refreshTimer = undefined;
    cancelAnimationFrame(refreshFrame);
    refreshFrame = 0;
    phase = 'moving';
    windowStart = now;
    frames = 0;
    setRatio(motionRatio());
    globe.resumeAnimation(); // draws at once, at the ratio just set
    frame = requestAnimationFrame(tick);
  };

  /** Something changed the picture without moving it (a texture arrived, a column is hovered): one new picture. */
  const refresh = (): void => {
    // A scene that keeps moving at rest shows the change with its next picture.
    if (!options.manage || disposed || phase === 'moving' || ambient.running() || refreshFrame || refreshTimer !== undefined) return;
    // Tiles arrive by the dozen after a zoom: on a slow machine one full picture for each would bring
    // back the blocked page this governor exists to avoid.
    const wait = quick() ? 0 : REFRESH_INTERVAL_MS - (performance.now() - lastRefresh);
    if (wait > 0) {
      refreshTimer = setTimeout(() => { refreshTimer = undefined; refresh(); }, wait);
      return;
    }
    refreshFrame = requestAnimationFrame(() => {
      refreshFrame = 0;
      if (disposed || phase === 'moving') return;
      lastRefresh = performance.now();
      // Redrawing the supersampled picture for every hover would cost more than the hover is worth.
      if (phase === 'refined' && !quick()) {
        phase = 'resting';
        setRatio(screenRatio());
        clearTimeout(refineTimer);
        refineTimer = setTimeout(refine, REFINE_MS);
      }
      draw();
    });
  };

  const onCameraChange = (): void => {
    // Compared with the last position that counted, so a slow drift still adds up to a visible move.
    const moved = camera.position.distanceTo(lastPosition) / Math.max(1, camera.position.length());
    if (moved < VISIBLE_ANGLE) return;
    lastPosition.copy(camera.position);
    move(SETTLE_MS);
  };
  const onInteractionStart = (): void => move(SETTLE_MS);

  controls.addEventListener('change', onCameraChange);
  controls.addEventListener('start', onInteractionStart);
  const unregister = registerSceneFrames(globe.scene(), animationMs => {
    if (animationMs > 0) move(animationMs);
    else refresh();
  });
  setRatio(motionRatio());
  frame = requestAnimationFrame(tick);

  return {
    move,
    refresh,
    /** The container or the screen's pixel ratio changed. */
    resized(): void {
      move(RESIZE_HOLD_MS);
      if (phase === 'moving') setRatio(motionRatio());
    },
    dispose(): void {
      disposed = true;
      ambient.stop();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(refreshFrame);
      clearTimeout(refineTimer);
      clearTimeout(refreshTimer);
      unregister();
      controls.removeEventListener('change', onCameraChange);
      controls.removeEventListener('start', onInteractionStart);
    },
  };
}
