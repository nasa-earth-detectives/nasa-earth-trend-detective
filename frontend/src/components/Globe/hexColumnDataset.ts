import { Color, DynamicDrawUsage, InstancedMesh, Sphere, Vector3 } from 'three';
import type { HexCell } from '../../types/hex.types';
import { sampleHexColor } from '../../config/hexPalette';
import { createHexPicking } from './hexPicking';
import { HEX_COLUMN_CONFIG } from './hexColumnState';
import type { HexColumnAppearance, HexColumnDataset, HexColumnResources, HexColumnState } from './hexColumnState';
import type { createHexColumnAnimation } from './hexColumnAnimation';

/** Actualiza la geografía sólo si cambia y conserva alturas/colores entre consultas. */
export function createHexColumnDatasetUpdater(
  resources: HexColumnResources,
  state: HexColumnState,
  appearance: HexColumnAppearance,
  animation: ReturnType<typeof createHexColumnAnimation>,
  select: (id: string | null) => void,
  onSelect: (cell: HexCell | null) => void,
) {
  const { globe, layer, geometry, material, radius, baseRadius, maxHeight,
    canvas, originalCursor, reducedMotion } = resources;
  const { paint, writeMatrices, animate } = animation;
  const normal = new Vector3();
  const east = new Vector3();
  const south = new Vector3();
  const mixed = new Color();

  const setDataset = (next: HexColumnDataset | null) => {
    const previous = state.layoutDataset;
    const sameLayout = !!next && !!previous && next.resolutionDegrees === previous.resolutionDegrees
      && next.cells.length === previous.cells.length && next.cells.every((cell, index) => {
        const old = previous.cells[index];
        return cell.id === old.id && cell.latitude === old.latitude && cell.longitude === old.longitude;
      });
    const cachedHeights = next?.cells.length && !sameLayout && previous
      ? new Map(previous.cells.map((cell, index) => [cell.id, state.heights[index]]))
      : null;
    const cachedColors = appearance.transitionColors && next?.cells.length && !sameLayout && previous
      ? new Map(previous.cells.map((cell, index) => [cell.id, state.baseColors.slice(index * 3, index * 3 + 3)]))
      : null;
    state.data = next;
    state.hoverIndex = -1;
    canvas.style.cursor = originalCursor;
    if (!next?.cells.length) {
      if (state.mesh) { state.mesh.count = 0; state.mesh.visible = false; }
      state.animating = false;
      // null significa consulta pendiente: oculta la lectura anterior pero
      // conserva la intención por ID. Una respuesta vacía sí la invalida.
      state.selectedIndex = -1;
      if (next !== null) state.selectedId = null;
      onSelect(null);
      return;
    }
    state.layoutDataset = next;
    const count = next.cells.length;
    let replacedMesh = false;
    if (!state.mesh || state.mesh.instanceMatrix.count < count) {
      if (state.mesh) { layer.remove(state.mesh); state.mesh.dispose(); }
      state.mesh = new InstancedMesh(geometry, material, count);
      state.mesh.name = 'earth-analysis-hex-columns';
      state.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      state.picking = createHexPicking(state.mesh, radius);
      layer.add(state.mesh);
      replacedMesh = true;
    }
    state.mesh.count = count;
    state.mesh.visible = state.visible;
    // La anchura es huella visual; no afirma una resolución real de NASA.
    const width = radius * Math.PI / 180 * next.resolutionDegrees * HEX_COLUMN_CONFIG.footprintRatio;
    state.mesh.boundingSphere = new Sphere(new Vector3(), Math.hypot(baseRadius + maxHeight, width));
    if (!sameLayout) {
      state.heights = new Float32Array(count);
      state.from = new Float32Array(count);
      state.target = new Float32Array(count);
      state.directions = new Float32Array(count * 3);
      state.baseColors = new Float32Array(count * 3);
      if (appearance.transitionColors) {
        state.fromColors = new Float32Array(count * 3);
        state.targetColors = new Float32Array(count * 3);
      }
      state.cellIndices.clear();
    }
    state.selectedIndex = -1;
    const elements = state.mesh.instanceMatrix.array;
    for (let index = 0; index < count; index++) {
      const cell = next.cells[index];
      if (!sameLayout || replacedMesh) {
        const coords = globe.getCoords(cell.latitude, cell.longitude, 0);
        normal.set(coords.x, coords.y, coords.z).normalize();
        const longitude = cell.longitude * Math.PI / 180;
        east.set(Math.cos(longitude), 0, -Math.sin(longitude));
        south.crossVectors(east, normal).normalize();
        normal.toArray(state.directions, index * 3);
        const matrix = index * 16;
        elements[matrix] = east.x * width;
        elements[matrix + 1] = east.y * width;
        elements[matrix + 2] = east.z * width;
        elements[matrix + 3] = 0;
        elements[matrix + 7] = 0;
        elements[matrix + 8] = south.x * width;
        elements[matrix + 9] = south.y * width;
        elements[matrix + 10] = south.z * width;
        elements[matrix + 11] = 0;
        elements[matrix + 15] = 1;
        state.cellIndices.set(cell.id, index);
        state.heights[index] = cachedHeights?.get(cell.id) ?? 0;
      }
      state.from[index] = state.heights[index];
      const magnitude = appearance.magnitude?.(cell, next) ?? Math.abs(cell.slope) / next.heightDomain;
      state.target[index] = Math.max(0, Math.min(1, magnitude)) * maxHeight;
      if (appearance.color) appearance.color(cell, next, mixed);
      else sampleHexColor(cell.slope, next.heightDomain, mixed);
      if (appearance.transitionColors) {
        mixed.toArray(state.targetColors, index * 3);
        const oldColor = sameLayout ? state.baseColors.subarray(index * 3, index * 3 + 3) : cachedColors?.get(cell.id);
        state.fromColors.set(oldColor ?? state.targetColors.subarray(index * 3, index * 3 + 3), index * 3);
        state.baseColors.set(state.fromColors.subarray(index * 3, index * 3 + 3), index * 3);
      } else mixed.toArray(state.baseColors, index * 3);
      if (cell.id === state.selectedId) state.selectedIndex = index;
    }
    if (!sameLayout || replacedMesh) state.picking?.rebuild(state.directions, baseRadius, width, maxHeight);
    for (let index = 0; index < count; index++) paint(index, false);
    if (state.mesh.instanceColor) {
      state.mesh.instanceColor.setUsage(DynamicDrawUsage);
      state.mesh.instanceColor.clearUpdateRanges();
      state.mesh.instanceColor.addUpdateRange(0, count * 3);
      state.mesh.instanceColor.needsUpdate = true;
    }
    state.started = performance.now();
    state.animating = true;
    writeMatrices();
    if (reducedMotion.matches) animate();
    if (state.selectedId) select(state.selectedId);
  };
  return setDataset;
}
