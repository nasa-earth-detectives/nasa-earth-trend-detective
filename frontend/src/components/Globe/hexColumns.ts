import {
  CylinderGeometry, Float32BufferAttribute, Group, MeshBasicMaterial, Raycaster, Vector2,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import type { HexCell } from '../../types/hex.types';
import { acquireEarthAnalysisRoot } from './earthAnalysisRoot';
import { createHexColumnAnimation } from './hexColumnAnimation';
import { createHexColumnDatasetUpdater } from './hexColumnDataset';
import { createHexColumnState, HEX_COLUMN_CONFIG } from './hexColumnState';
import type { HexColumnAppearance, HexColumnResources } from './hexColumnState';

export { HEX_COLUMN_CONFIG } from './hexColumnState';
export type { HexColumnAppearance, HexColumnDataset } from './hexColumnState';

/** Columnas tangentes al planeta, con una geometría y una llamada de dibujo compartidas. */
export function createHexColumns(globe: GlobeInstance, onSelect: (cell: HexCell | null) => void, appearance: HexColumnAppearance = {}) {
  const radius = globe.getGlobeRadius();
  const baseRadius = radius * HEX_COLUMN_CONFIG.baseRatio;
  const maxHeight = radius * HEX_COLUMN_CONFIG.maxHeightRatio;
  const layer = new Group();
  layer.name = 'earth-analysis-layer';
  // Hexágonos y mapa de calor comparten la transformación de entrada del planeta.
  const sharedRoot = acquireEarthAnalysisRoot(globe);
  sharedRoot.group.add(layer);
  const geometry = new CylinderGeometry(1, 1, 1, 6, 1, false);
  const normals = geometry.getAttribute('normal');
  const faceColors = new Float32Array(normals.count * 3);
  // Caras legibles también de noche: esta es una capa analítica, no otro material terrestre.
  for (let i = 0; i < normals.count; i++) {
    const shade = normals.getY(i) > 0.5 ? 0.86 : 0.28 + 0.12 * (normals.getX(i) + 1);
    faceColors.set([shade, shade, shade], i * 3);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(faceColors, 3));
  const material = new MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const canvas = globe.renderer().domElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const originalCursor = canvas.style.cursor;
  const resources: HexColumnResources = {
    globe, layer, geometry, material, canvas, originalCursor, reducedMotion,
    radius, baseRadius, maxHeight,
  };
  const state = createHexColumnState();
  const animation = createHexColumnAnimation(resources, state, appearance);
  const { paint } = animation;
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let lastHover = 0;

  const select = (id: string | null) => {
    const previous = state.selectedIndex;
    state.selectedIndex = id === null || !state.data?.cells.length ? -1 : state.cellIndices.get(id) ?? -1;
    state.selectedId = state.selectedIndex >= 0 ? id : null;
    if (previous >= 0 && previous !== state.selectedIndex) paint(previous);
    if (state.selectedIndex >= 0) paint(state.selectedIndex);
    onSelect(state.selectedIndex >= 0 ? state.data!.cells[state.selectedIndex] : null);
  };

  const setDataset = createHexColumnDatasetUpdater(resources, state, appearance, animation, select, onSelect);
  const pickIndex = (x: number, y: number): number => {
    if (!state.mesh?.visible || !state.mesh.count) return -1;
    const rect = canvas.getBoundingClientRect();
    pointer.set(x / rect.width * 2 - 1, 1 - y / rect.height * 2);
    raycaster.setFromCamera(pointer, globe.camera());
    state.mesh.updateWorldMatrix(true, false);
    return raycaster.intersectObject(state.mesh, false)[0]?.instanceId ?? -1;
  };
  const onMove = (event: PointerEvent) => {
    if (event.buttons || event.pointerType === 'touch' || performance.now() - lastHover < 45) return;
    lastHover = performance.now();
    const rect = canvas.getBoundingClientRect();
    const next = pickIndex(event.clientX - rect.left, event.clientY - rect.top);
    if (next === state.hoverIndex) return;
    const previous = state.hoverIndex;
    state.hoverIndex = next;
    if (previous >= 0) paint(previous);
    if (next >= 0) paint(next);
    canvas.style.cursor = next >= 0 ? 'pointer' : originalCursor;
  };
  const clearHover = () => {
    const previous = state.hoverIndex;
    state.hoverIndex = -1;
    if (previous >= 0) paint(previous);
    canvas.style.cursor = originalCursor;
  };
  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', clearHover);
  // Reutiliza el frame de la escena y actualiza matrices antes de subir buffers a GPU.
  const scene = globe.scene();
  const previousBeforeRender = scene.onBeforeRender;
  const beforeRender: typeof scene.onBeforeRender = (renderer, currentScene, camera, geometry, renderedMaterial, group) => {
    previousBeforeRender.call(scene, renderer, currentScene, camera, geometry, renderedMaterial, group);
    animation.render(camera);
  };
  scene.onBeforeRender = beforeRender;
  return {
    setDataset,
    select,
    setVisible(value: boolean) {
      state.visible = value;
      if (state.mesh) state.mesh.visible = value && state.mesh.count > 0;
      if (!value) { clearHover(); select(null); }
    },
    pick(x: number, y: number): boolean {
      const index = pickIndex(x, y);
      select(index >= 0 ? state.data!.cells[index].id : null);
      return index >= 0;
    },
    dispose() {
      if (scene.onBeforeRender === beforeRender) scene.onBeforeRender = previousBeforeRender;
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', clearHover);
      canvas.style.cursor = originalCursor;
      if (state.mesh) { layer.remove(state.mesh); state.mesh.dispose(); }
      state.mesh = null;
      state.visible = false;
      state.animating = false;
      layer.removeFromParent();
      sharedRoot.release();
      geometry.dispose();
      material.dispose();
      state.data = null;
      state.layoutDataset = null;
      state.picking = null;
      state.cellIndices.clear();
    },
  };
}
