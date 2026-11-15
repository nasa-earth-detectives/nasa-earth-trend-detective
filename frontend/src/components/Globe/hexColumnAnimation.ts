import { Color, SRGBColorSpace, Vector3 } from 'three';
import type { Camera } from 'three';
import { HEX_COLUMN_CONFIG } from './hexColumnState';
import type { HexColumnAppearance, HexColumnResources, HexColumnState } from './hexColumnState';

/** Interpolates existing buffers and regulates brightness without allocating objects per frame. */
export function createHexColumnAnimation(
  resources: HexColumnResources, state: HexColumnState, appearance: HexColumnAppearance,
) {
  const { baseRadius, radius, material, reducedMotion } = resources;
  const highlight = new Color('#f1f0ec');
  const mixed = new Color();
  const cameraPosition = new Vector3();
  const earthPosition = new Vector3();
  let lastBrightness = -1;

  const paint = (index: number, upload = true) => {
    if (!state.mesh || !state.data?.cells[index]) return;
    // Focus highlights the diverging color itself without turning blue/red into amber.
    mixed.fromArray(state.baseColors, index * 3).lerp(highlight, index === state.selectedIndex ? 0.2 : index === state.hoverIndex ? 0.1 : 0);
    state.mesh.setColorAt(index, mixed);
    if (upload && state.mesh.instanceColor) {
      state.mesh.instanceColor.addUpdateRange(index * 3, 3);
      state.mesh.instanceColor.needsUpdate = true;
    }
  };

  const writeMatrices = (eased?: number) => {
    if (!state.mesh) return;
    const elements = state.mesh.instanceMatrix.array;
    for (let i = 0; i < state.mesh.count; i++) {
      if (eased !== undefined) state.heights[i] = state.from[i] + (state.target[i] - state.from[i]) * eased;
      // Zero value = no column; 0.001 baseline only prevents singular matrix.
      const height = Math.max(0.001, state.heights[i]);
      const center = baseRadius + height / 2;
      const direction = i * 3;
      const matrix = i * 16;
      // X/Z and orientation are constant. Only height and radial position change.
      elements[matrix + 4] = state.directions[direction] * height;
      elements[matrix + 5] = state.directions[direction + 1] * height;
      elements[matrix + 6] = state.directions[direction + 2] * height;
      elements[matrix + 12] = state.directions[direction] * center;
      elements[matrix + 13] = state.directions[direction + 1] * center;
      elements[matrix + 14] = state.directions[direction + 2] * center;
    }
    state.mesh.instanceMatrix.clearUpdateRanges();
    state.mesh.instanceMatrix.addUpdateRange(0, state.mesh.count * 16);
    state.mesh.instanceMatrix.needsUpdate = true;
  };
  const animate = () => {
    if (!state.animating) return;
    const t = reducedMotion.matches ? 1 : Math.min(1, (performance.now() - state.started)
      / (appearance.transitionMs ?? HEX_COLUMN_CONFIG.transitionMs));
    const eased = 1 - (1 - t) ** 3;
    writeMatrices(eased);
    if (appearance.transitionColors && state.mesh) {
      for (let index = 0; index < state.baseColors.length; index++) {
        state.baseColors[index] = state.fromColors[index] + (state.targetColors[index] - state.fromColors[index]) * eased;
      }
      for (let index = 0; index < state.mesh.count; index++) paint(index, false);
      if (state.mesh.instanceColor) {
        state.mesh.instanceColor.clearUpdateRanges();
        state.mesh.instanceColor.addUpdateRange(0, state.mesh.count * 3);
        state.mesh.instanceColor.needsUpdate = true;
      }
    }
    if (t === 1) state.animating = false;
  };
  const render = (camera: Camera) => {
    if (!state.visible || !state.mesh?.visible) return;
    animate();
    cameraPosition.setFromMatrixPosition(camera.matrixWorld);
    earthPosition.setFromMatrixPosition(state.mesh.matrixWorld);
    const worldRadius = radius * state.mesh.matrixWorld.getMaxScaleOnAxis();
    const altitude = worldRadius > 0 ? cameraPosition.distanceTo(earthPosition) / worldRadius - 1 : Infinity;
    const proximity = Math.max(0, Math.min(1,
      (HEX_COLUMN_CONFIG.farAltitude - altitude) / (HEX_COLUMN_CONFIG.farAltitude - HEX_COLUMN_CONFIG.nearAltitude),
    ));
    const smooth = proximity * proximity * (3 - 2 * proximity);
    const brightness = HEX_COLUMN_CONFIG.farBrightness
      + (HEX_COLUMN_CONFIG.nearBrightness - HEX_COLUMN_CONFIG.farBrightness) * smooth;
    if (Math.abs(brightness - lastBrightness) > 0.0001) {
      // One uniform for the entire layer: never alters data, matrices, or signs.
      // Keeping full opacity avoids sorting thousands of transparent columns and
      // preserves Earth/cloud occlusion within a single InstancedMesh.
      material.color.setRGB(brightness, brightness, brightness, SRGBColorSpace);
      lastBrightness = brightness;
    }
  };
  return { paint, writeMatrices, animate, render };
}
