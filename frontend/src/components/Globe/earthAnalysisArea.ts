import {
  BufferAttribute, BufferGeometry, CanvasTexture, DoubleSide, Group, Mesh, MeshBasicMaterial, Points, PointsMaterial,
} from 'three';
import type { GlobeInstance } from 'globe.gl';
import type { AnalysisArea } from '../../types/globe.types';

/** Patches follow the curve of the planet: one vertex every this many degrees. */
const STEP_DEGREES = 2;
const COLOR = '#ffd9a8';
const FILL_ALTITUDE = 0.006;
const FRAME_ALTITUDE = 0.012;
const MARKER_ALTITUDE = 0.03;
const MARKER_PIXELS = 34;

/** Rectangle in latitude and longitude laid on the sphere, slightly above the surface. */
function patch(globe: GlobeInstance, south: number, north: number, west: number, east: number, altitude: number): BufferGeometry {
  const rows = Math.max(1, Math.ceil((north - south) / STEP_DEGREES));
  const columns = Math.max(1, Math.ceil((east - west) / STEP_DEGREES));
  const positions = new Float32Array((rows + 1) * (columns + 1) * 3);
  let offset = 0;
  for (let row = 0; row <= rows; row += 1) {
    for (let column = 0; column <= columns; column += 1) {
      const { x, y, z } = globe.getCoords(south + (north - south) * row / rows, west + (east - west) * column / columns, altitude);
      positions[offset++] = x; positions[offset++] = y; positions[offset++] = z;
    }
  }
  const index: number[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const a = row * (columns + 1) + column;
      const b = a + columns + 1;
      index.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setIndex(index);
  return geometry;
}

function ringTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    context.strokeStyle = context.fillStyle = '#ffffff';
    context.lineWidth = 5;
    context.beginPath(); context.arc(32, 32, 23, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.arc(32, 32, 6, 0, Math.PI * 2); context.fill();
  }
  return new CanvasTexture(canvas);
}

/**
 * Draws on the globe what the open analysis covers, so the figures on the panel can be matched to a
 * place: the box of a whole region, filled and framed, or the 2° box of a single point. A point's box
 * is only a few pixels wide from orbit, so it also gets a ring that keeps its size on screen.
 */
export function createEarthAnalysisArea(globe: GlobeInstance) {
  const root = new Group();
  root.name = 'analysis-area';
  const fill = new MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.16, depthWrite: false, side: DoubleSide, toneMapped: false });
  const frame = new MeshBasicMaterial({ color: COLOR, transparent: true, opacity: 0.95, depthWrite: false, side: DoubleSide, toneMapped: false });
  const ring = ringTexture();
  const marker = new PointsMaterial({ color: COLOR, size: MARKER_PIXELS, sizeAttenuation: false, map: ring,
    transparent: true, depthWrite: false, toneMapped: false });
  let geometries: BufferGeometry[] = [];
  globe.scene().add(root);

  const clear = (): void => {
    root.clear();
    geometries.forEach(geometry => geometry.dispose());
    geometries = [];
  };
  const add = (geometry: BufferGeometry, material: MeshBasicMaterial): void => {
    const mesh = new Mesh(geometry, material);
    mesh.renderOrder = 3;
    mesh.raycast = () => {};
    geometries.push(geometry);
    root.add(mesh);
  };

  return {
    set(area: AnalysisArea | null): void {
      clear();
      if (!area) return;
      const south = Math.max(-90, area.lat - area.latRadius);
      const north = Math.min(90, area.lat + area.latRadius);
      const west = area.lng - area.lngRadius;
      const east = area.lng + area.lngRadius;
      // Frame width: a small share of the box, never thinner than what survives from orbit.
      const width = Math.min(0.6, Math.max(0.14, 0.04 * Math.min(north - south, east - west)));
      const widthAcross = Math.min((east - west) / 4, width / Math.max(0.2, Math.cos(area.lat * Math.PI / 180)));
      add(patch(globe, south, north, west, east, FILL_ALTITUDE), fill);
      add(patch(globe, south, south + width, west, east, FRAME_ALTITUDE), frame);
      add(patch(globe, north - width, north, west, east, FRAME_ALTITUDE), frame);
      // A region that goes all the way round (the Arctic) has no sides.
      if (east - west < 360) {
        add(patch(globe, south + width, north - width, west, west + widthAcross, FRAME_ALTITUDE), frame);
        add(patch(globe, south + width, north - width, east - widthAcross, east, FRAME_ALTITUDE), frame);
      }
      if (area.point) {
        const { x, y, z } = globe.getCoords(area.lat, area.lng, MARKER_ALTITUDE);
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(new Float32Array([x, y, z]), 3));
        const points = new Points(geometry, marker);
        points.renderOrder = 4;
        points.raycast = () => {};
        geometries.push(geometry);
        root.add(points);
      }
    },
    dispose(): void {
      clear();
      globe.scene().remove(root);
      fill.dispose(); frame.dispose(); marker.dispose(); ring.dispose();
    },
  };
}
