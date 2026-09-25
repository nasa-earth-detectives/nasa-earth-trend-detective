import type { Color, CylinderGeometry, Group, InstancedMesh, MeshBasicMaterial } from 'three';
import type { GlobeInstance } from 'globe.gl';
import type { HexCell, HexDataset } from '../../types/hex.types';
import type { createHexPicking } from './hexPicking';

export type HexColumnDataset = Pick<HexDataset, 'cells' | 'variable' | 'heightDomain' | 'resolutionDegrees'>;

/** La geometría desconoce unidades: el adaptador aporta color y magnitud normalizada. */
export interface HexColumnAppearance {
  transitionMs?: number;
  transitionColors?: boolean;
  color?: (cell: HexCell, data: HexColumnDataset, target: Color) => Color;
  magnitude?: (cell: HexCell, data: HexColumnDataset) => number;
}

/** Escala analítica exagerada para lectura; nunca representa elevación del terreno. */
export const HEX_COLUMN_CONFIG = {
  maxHeightRatio: 0.03, footprintRatio: 0.25, baseRatio: 1.0018, transitionMs: 440,
  nearAltitude: 0.65, farAltitude: 2.6, nearBrightness: 0.94, farBrightness: 0.55,
} as const;

/** Recursos estables propiedad del coordinador; los módulos auxiliares no los liberan. */
export interface HexColumnResources {
  globe: GlobeInstance;
  layer: Group;
  geometry: CylinderGeometry;
  material: MeshBasicMaterial;
  canvas: HTMLCanvasElement;
  originalCursor: string;
  reducedMotion: MediaQueryList;
  radius: number;
  baseRadius: number;
  maxHeight: number;
}

/** Estado de datos y buffers que comparten selección, animación y actualizaciones. */
export function createHexColumnState() {
  return {
    mesh: null as InstancedMesh | null,
    picking: null as ReturnType<typeof createHexPicking> | null,
    data: null as HexColumnDataset | null,
    // Una consulta puede vaciar data mientras carga el siguiente año; la malla
    // geográfica y las alturas previas siguen siendo válidas durante esa espera.
    layoutDataset: null as HexColumnDataset | null,
    visible: true,
    selectedId: null as string | null,
    selectedIndex: -1,
    hoverIndex: -1,
    heights: new Float32Array(0),
    from: new Float32Array(0),
    target: new Float32Array(0),
    directions: new Float32Array(0),
    baseColors: new Float32Array(0),
    fromColors: new Float32Array(0),
    targetColors: new Float32Array(0),
    cellIndices: new Map<string, number>(),
    started: 0,
    animating: false,
  };
}

export type HexColumnState = ReturnType<typeof createHexColumnState>;
