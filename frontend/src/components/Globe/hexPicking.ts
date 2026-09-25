import { Box3, Matrix4, Mesh, Ray, Sphere, Vector3 } from 'three';
import type { InstancedMesh, Intersection, Raycaster } from 'three';

interface PickNode {
  bounds: Box3;
  start: number;
  end: number;
  left: number;
  right: number;
}

/**
 * BVH de las huellas terrestres. Sus cajas incluyen la altura máxima, por lo que
 * no se reconstruye al animar años. El raycast exacto de Three sólo examina hojas
 * atravesadas; también acelera las consultas internas de Globe.gl.
 */
export function createHexPicking(mesh: InstancedMesh, earthRadius: number) {
  const inverseWorld = new Matrix4();
  const instanceMatrix = new Matrix4();
  const localRay = new Ray();
  const hitPoint = new Vector3();
  const earth = new Sphere(new Vector3(), earthRadius);
  const exactMesh = new Mesh(mesh.geometry, mesh.material);
  const exactHits: Intersection[] = [];
  const stack: number[] = [];
  let nodes: PickNode[] = [];
  let indices: number[] = [];

  const rebuild = (directions: Float32Array, baseRadius: number, width: number, maxHeight: number) => {
    const count = directions.length / 3;
    const centers = new Float32Array(count * 3);
    const boxes = new Float32Array(count * 6);
    indices = Array.from({ length: count }, (_, index) => index);
    nodes = [];
    for (let index = 0; index < count; index++) {
      for (let axis = 0; axis < 3; axis++) {
        const direction = directions[index * 3 + axis];
        const low = direction * baseRadius;
        const high = direction * (baseRadius + maxHeight);
        centers[index * 3 + axis] = (low + high) / 2;
        // ±width contiene cualquier orientación de la sección hexagonal.
        boxes[index * 6 + axis] = Math.min(low, high) - width;
        boxes[index * 6 + axis + 3] = Math.max(low, high) + width;
      }
    }
    const build = (start: number, end: number): number => {
      const bounds = new Box3();
      for (let offset = start; offset < end; offset++) {
        const box = indices[offset] * 6;
        bounds.min.x = Math.min(bounds.min.x, boxes[box]);
        bounds.min.y = Math.min(bounds.min.y, boxes[box + 1]);
        bounds.min.z = Math.min(bounds.min.z, boxes[box + 2]);
        bounds.max.x = Math.max(bounds.max.x, boxes[box + 3]);
        bounds.max.y = Math.max(bounds.max.y, boxes[box + 4]);
        bounds.max.z = Math.max(bounds.max.z, boxes[box + 5]);
      }
      const nodeIndex = nodes.length;
      const node: PickNode = { bounds, start, end, left: -1, right: -1 };
      nodes.push(node);
      if (end - start <= 12) return nodeIndex;
      const x = bounds.max.x - bounds.min.x;
      const y = bounds.max.y - bounds.min.y;
      const z = bounds.max.z - bounds.min.z;
      const axis = x >= y && x >= z ? 0 : y >= z ? 1 : 2;
      const ordered = indices.slice(start, end).sort((a, b) => centers[a * 3 + axis] - centers[b * 3 + axis]);
      for (let offset = 0; offset < ordered.length; offset++) indices[start + offset] = ordered[offset];
      const middle = (start + end) >>> 1;
      node.left = build(start, middle);
      node.right = build(middle, end);
      return nodeIndex;
    };
    if (count) build(0, count);
  };

  const raycast = (raycaster: Raycaster, intersections: Intersection[]) => {
    if (!mesh.visible || !mesh.count || !nodes.length) return;
    inverseWorld.copy(mesh.matrixWorld).invert();
    localRay.copy(raycaster.ray).applyMatrix4(inverseWorld);
    const scale = mesh.matrixWorld.getMaxScaleOnAxis();
    const earthHit = localRay.intersectSphere(earth, hitPoint);
    const localLimit = earthHit ? localRay.origin.distanceTo(hitPoint) + 0.05 / scale : Infinity;
    const worldLimit = earthHit
      ? raycaster.ray.origin.distanceTo(hitPoint.applyMatrix4(mesh.matrixWorld)) + 0.05
      : raycaster.far;
    stack.length = 0;
    stack.push(0);
    while (stack.length) {
      const node = nodes[stack.pop()!];
      const boxHit = localRay.intersectBox(node.bounds, hitPoint);
      if (!boxHit) continue;
      if (!node.bounds.containsPoint(localRay.origin) && localRay.origin.distanceTo(hitPoint) > localLimit) continue;
      if (node.left >= 0) {
        stack.push(node.left, node.right);
        continue;
      }
      for (let offset = node.start; offset < node.end; offset++) {
        const instanceId = indices[offset];
        if (instanceId >= mesh.count) continue;
        mesh.getMatrixAt(instanceId, instanceMatrix);
        exactMesh.matrixWorld.multiplyMatrices(mesh.matrixWorld, instanceMatrix);
        exactHits.length = 0;
        exactMesh.raycast(raycaster, exactHits);
        for (const hit of exactHits) {
          // La esfera oculta el hemisferio lejano, incluso en raycasts de Globe.
          if (hit.distance > worldLimit) continue;
          hit.instanceId = instanceId;
          hit.object = mesh;
          intersections.push(hit);
        }
      }
    }
  };

  mesh.geometry.computeBoundingBox();
  mesh.geometry.computeBoundingSphere();
  mesh.raycast = raycast;
  return { rebuild };
}
