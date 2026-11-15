import type { Object3D } from 'three';
import { AMBIENT_FREE_MS, AMBIENT_MAX_INTERVAL_MS } from './frameGovernorConfig';

interface Pausable { resumeAnimation(): unknown }

/**
 * Keeps a scene that came to rest alive. Satellites, ripples and arcs move with the clock, so a picture
 * that is never drawn again shows them frozen until someone touches the globe.
 *
 * Each picture is timed (until the browser serves the next frame). A machine that draws in 17 ms draws
 * every frame; past what still feels fluid the page gets time back, up to as long as the picture took:
 * one that needs 90 ms draws five or six a second and is free to answer a click half of the time.
 * Satellites take 66 s per orbit on screen, so even that pace reads as motion.
 *
 * The caller has paused Globe.gl, which also stops the clocks of its own layers (ripples, arcs,
 * currents): the globe object inside the scene starts them again while the pictures are drawn here.
 */
export function createAmbientFrames(draw: () => void, scene: Object3D) {
  const layers = scene.children.find(child => typeof (child as Partial<Pausable>).resumeAnimation === 'function') as Pausable | undefined;
  let frame = 0;
  let drawnAt = 0;
  let nextAt = 0;
  let cost = 0;
  let timing = false;

  const step = (now: number): void => {
    frame = requestAnimationFrame(step);
    if (timing) {
      timing = false;
      // A gap of seconds is a hidden tab or a sleeping machine, not the price of a picture.
      const sample = Math.min(now - drawnAt, AMBIENT_MAX_INTERVAL_MS);
      cost = cost ? (cost + sample) / 2 : sample;
      const rest = Math.min(cost, 3 * Math.max(0, cost - AMBIENT_FREE_MS));
      nextAt = drawnAt + Math.min(AMBIENT_MAX_INTERVAL_MS, cost + rest);
    }
    // Half a frame of slack: frame times jitter, and a picture due "now" must not wait a whole frame.
    if (now + 8 < nextAt) return;
    drawnAt = now;
    timing = true;
    draw();
  };

  return {
    start(): void {
      if (frame) return;
      cost = 0;
      nextAt = 0;
      timing = false;
      layers?.resumeAnimation();
      frame = requestAnimationFrame(step);
    },
    stop(): void {
      cancelAnimationFrame(frame);
      frame = 0;
    },
    running: (): boolean => frame !== 0,
  };
}
