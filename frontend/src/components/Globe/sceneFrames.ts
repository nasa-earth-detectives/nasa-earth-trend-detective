import type { Object3D } from 'three';

/**
 * A scene that draws only when something changes has to be told when something did. Whatever loads or
 * computes in the background (a texture, a model, the raster a worker returns) or reacts to the pointer
 * asks for a frame here; the frame governor of that scene decides what it costs. A scene that always
 * draws has no governor registered and the request does nothing.
 */
type FrameRequest = (animationMs: number) => void;

const requests = new WeakMap<object, FrameRequest>();

export function registerSceneFrames(scene: object, request: FrameRequest): () => void {
  requests.set(scene, request);
  return () => { if (requests.get(scene) === request) requests.delete(scene); };
}

/**
 * Asks the scene that contains `object` for a new picture. `animationMs` is how long the change keeps
 * moving on its own (a transition); 0 means one new picture is enough.
 */
export function requestSceneFrame(object: Object3D, animationMs = 0): void {
  let root = object;
  while (root.parent) root = root.parent;
  requests.get(root)?.(animationMs);
}
