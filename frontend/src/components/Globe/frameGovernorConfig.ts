/**
 * Tuning of the frame governor (frameGovernor.ts): how long things take to settle, the frame rates that
 * count as slow or fast, and how far the resolution may move. Chosen while measuring a browser that
 * renders by software at 1366x768; none of them has been tuned on real weak hardware yet.
 */

/** A camera move is over when no visible change has arrived for this long. */
export const SETTLE_MS = 140;
/** The sharpest picture waits until the scene has really come to rest: a pause in the middle of a drag should not pay for it. */
export const REFINE_MS = 450;
/** On a machine that is not quick, single pictures (a tile arrived, a column is hovered) are at least this far apart. */
export const REFRESH_INTERVAL_MS = 250;
/** After a resize Globe.gl resizes the canvas a moment later, which empties it: keep drawing until then. */
export const RESIZE_HOLD_MS = 300;
/** How long a change asked through the scene's interface keeps animating (column transitions take 800 ms). */
export const TRANSITION_MS = 950;
/** Frames are averaged over windows of this length: short while moving, long when only watching. */
export const MOTION_WINDOW_MS = 500;
export const WATCH_WINDOW_MS = 2000;
/** The first seconds include texture uploads and shader compilation: they say nothing about steady speed. */
export const WARMUP_MS = 5000;
export const SLOW_FPS = 22;
export const FAST_FPS = 50;
/** A scene kept alive because the machine was fast goes back to drawing on demand below this rate. */
export const LIVELY_FLOOR_FPS = 30;
/** How many times a scene that may stay alive tries a quiet window before resting. A slow machine pays for each. */
export const LIVELY_TRIALS = 3;
export const MIN_MOTION_SCALE = 0.5;
export const SCALE_STEP = 0.75;
/** Camera changes below this angle (radians) per frame are under a fifth of a pixel: the tail of the controls' damping. */
export const VISIBLE_ANGLE = 6e-4;
/** A picture drawn in this time still feels fluid (22 a second): a scene at rest that manages it draws every frame. */
export const AMBIENT_FREE_MS = 45;
/** However slow the machine, a scene at rest shows what moves on it at least this often. */
export const AMBIENT_MAX_INTERVAL_MS = 500;
export const MAX_REFINED_RATIO = 3;
/** The supersampled picture is a single frame, but its buffers still have to fit in a weak machine's memory. */
export const MAX_REFINED_PIXELS = 9_000_000;

export interface FrameGovernorOptions {
  /** Pixel ratio of the screen, already capped. */
  devicePixelRatio: () => number;
  /** Draw on demand at adaptive resolution. False: the scene always draws and is only watched. */
  manage: boolean;
  /** A managed scene keeps drawing every frame for as long as the machine does it fast. */
  liveWhenFast: boolean;
  /** Sharpness of the resting picture: 2 draws it with twice the screen's pixels on each side. */
  restSupersampling: number;
  /** Something keeps the scene moving on its own (auto-rotation). */
  isAnimating: () => boolean;
  /** Something on screen moves with the clock (satellites, ripples, arcs, currents): a scene at rest keeps drawing it. */
  keepsMoving: () => boolean;
  /** Called once, with the scene still, if it stays slow with nothing left to give up in this profile. */
  onTooSlow?: () => void;
  /** Frames per second measured while a managed scene moves. */
  onMotionRate?: (framesPerSecond: number) => void;
}
