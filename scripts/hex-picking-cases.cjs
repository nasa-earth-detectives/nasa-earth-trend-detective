const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');

// Contrasta el raycast acelerado con Three y la oclusión de la Tierra.
function validatePickingRays({ three, mesh, radius, scene, camera }) {
  const raycaster = new three.Raycaster();
  const inverse = new three.Matrix4();
  const localRay = new three.Ray();
  const earth = new three.Sphere(new three.Vector3(), radius);
  const hitPoint = new three.Vector3();
  const instanceMatrix = new three.Matrix4();
  const points = [];
  const measurements = [];
  let comparisons = 0;
  let positiveHits = 0;
  let rejectedBackside = 0;
  function nearest(native, targetMesh = mesh) {
    const intersections = [];
    (native ? three.InstancedMesh.prototype.raycast : targetMesh.raycast).call(targetMesh, raycaster, intersections);
    let limit = Infinity;
    if (native) {
      inverse.copy(targetMesh.matrixWorld).invert();
      localRay.copy(raycaster.ray).applyMatrix4(inverse);
      if (localRay.intersectSphere(earth, hitPoint)) {
        limit = raycaster.ray.origin.distanceTo(hitPoint.applyMatrix4(targetMesh.matrixWorld)) + 0.05;
      }
    }
    intersections.sort((a, b) => a.distance - b.distance);
    const valid = intersections.find(hit => hit.distance <= limit);
    if (native && !valid && intersections.length) rejectedBackside++;
    return valid;
  }
  const views = [
    { name: 'frontal', position: [-67, 99, 305], scale: 1, translation: [0, 0, 0], rotation: [0, 0, 0] },
    { name: 'opposite', position: [67, -99, -305], scale: 1, translation: [0, 0, 0], rotation: [0, 0, 0] },
    { name: 'limb', position: [320, 0, 20], scale: 1, translation: [0, 0, 0], rotation: [0, 0, 0] },
    { name: 'intro+offset', position: [-90, 110, 220], scale: 0.46, translation: [26, -12, 18], rotation: [0.12, -0.48, 0.1] },
    { name: 'near', position: [-32, 47, 145], scale: 1, translation: [0, 0, 0], rotation: [0, 0, 0] },
  ];
  for (const view of views) {
    mesh.parent.position.fromArray(view.translation);
    mesh.parent.rotation.fromArray(view.rotation);
    mesh.parent.scale.setScalar(view.scale);
    scene.updateMatrixWorld(true);
    camera.position.fromArray(view.position);
    camera.lookAt(mesh.parent.position);
    camera.updateMatrixWorld(true);
    points.length = 0;
    // Rayos a centros exactos: prueba topes, columnas parcialmente ocluidas y reverso.
    for (let i = 0; i < mesh.count; i += 61) {
      mesh.getMatrixAt(i, instanceMatrix);
      points.push(new three.Vector3(0, 0.5, 0).applyMatrix4(instanceMatrix).applyMatrix4(mesh.matrixWorld));
    }
    // Barrido de pantalla: huecos, silueta y espacio fuera del planeta.
    for (let y = -1; y <= 1.01; y += 0.2) {
      for (let x = -1; x <= 1.01; x += 0.2) {
        raycaster.setFromCamera(new three.Vector2(x, y), camera);
        points.push(raycaster.ray.at(200, new three.Vector3()));
      }
    }
    let nativeMs = 0;
    let acceleratedMs = 0;
    for (const point of points) {
      raycaster.set(camera.position, new three.Vector3().subVectors(point, camera.position).normalize());
      let started = performance.now();
      const baseline = nearest(true);
      nativeMs += performance.now() - started;
      started = performance.now();
      const actual = nearest(false);
      acceleratedMs += performance.now() - started;
      assert.equal(actual?.instanceId, baseline?.instanceId, `${view.name}, rayo ${comparisons}`);
      if (actual) {
        positiveHits++;
        assert(Math.abs(actual.distance - baseline.distance) < 1e-7);
      }
      comparisons++;
    }
    measurements.push({ view: view.name, rays: points.length, nativeAverageMs: nativeMs / points.length, bvhAverageMs: acceleratedMs / points.length });
  }
  assert(positiveHits > 100);
  assert(rejectedBackside > 50, 'Se contrastan impactos que deben quedar ocultos tras la Tierra.');
  return {
    nearest, views, raycaster, instanceMatrix, measurements, comparisons, positiveHits,
    get rejectedBackside() { return rejectedBackside; },
  };
}

function validateGlobalPicking({ three, globalMesh, scene, camera, picking }) {
  const { views, raycaster, instanceMatrix, nearest } = picking;
  let globalComparisons = 0;
  for (const view of views) {
    globalMesh.parent.position.fromArray(view.translation);
    globalMesh.parent.rotation.fromArray(view.rotation);
    globalMesh.parent.scale.setScalar(view.scale);
    scene.updateMatrixWorld(true);
    camera.position.fromArray(view.position);
    camera.lookAt(globalMesh.parent.position);
    camera.updateMatrixWorld(true);
    for (let i = 0; i < globalMesh.count; i += 71) {
      globalMesh.getMatrixAt(i, instanceMatrix);
      const localTip = new three.Vector3(0, 0.5, 0).applyMatrix4(instanceMatrix);
      assert(globalMesh.boundingSphere.containsPoint(localTip));
      const target = localTip.applyMatrix4(globalMesh.matrixWorld);
      raycaster.set(camera.position, new three.Vector3().subVectors(target, camera.position).normalize());
      const baseline = nearest(true, globalMesh);
      const actual = nearest(false, globalMesh);
      assert.equal(actual?.instanceId, baseline?.instanceId, `Global ${view.name}, ${i}`);
      if (actual) assert(Math.abs(actual.distance - baseline.distance) < 1e-7);
      globalComparisons++;
    }
  }
  return globalComparisons;
}

// El detalle por distancia conserva buffers y no emite selecciones por frame.
function validateDistanceBrightness({ three, globalMesh, radius, scene, camera, selections, HEX_COLUMN_CONFIG }) {
  const frozenMatrices = globalMesh.instanceMatrix.array.slice();
  const frozenColors = globalMesh.instanceColor.array.slice();
  const matrixVersion = globalMesh.instanceMatrix.version;
  const colorVersion = globalMesh.instanceColor.version;
  const selectionCount = selections.length;
  function distanceFrame(altitude, scale = 1) {
    globalMesh.parent.position.set(26, -12, 18);
    globalMesh.parent.scale.setScalar(scale);
    scene.updateMatrixWorld(true);
    camera.position.copy(globalMesh.parent.position).add(new three.Vector3(0, 0, radius * scale * (1 + altitude)));
    camera.updateMatrixWorld(true);
    scene.onBeforeRender({}, scene, camera, null, null, null);
    return globalMesh.material.color.getRGB(new three.Color(), three.SRGBColorSpace).r;
  }
  const farBrightness = distanceFrame(6);
  const middleBrightness = distanceFrame(1.5);
  const nearBrightness = distanceFrame(0.5);
  assert(Math.abs(farBrightness - HEX_COLUMN_CONFIG.farBrightness) < 1e-5, `Brillo lejano: ${farBrightness}`);
  assert(Math.abs(nearBrightness - HEX_COLUMN_CONFIG.nearBrightness) < 1e-5, `Brillo cercano: ${nearBrightness}`);
  assert(farBrightness < middleBrightness && middleBrightness < nearBrightness);
  assert(Math.abs(distanceFrame(1.5, 0.46) - middleBrightness) < 1e-6, 'La profundidad visual respeta escala y desplazamiento de entrada.');
  for (let frame = 0; frame < 120; frame++) distanceFrame(0.5 + frame / 20);
  assert.equal(globalMesh.instanceMatrix.version, matrixVersion, 'El zoom no sube matrices mientras las alturas están quietas.');
  assert.equal(globalMesh.instanceColor.version, colorVersion, 'El zoom no reescribe la paleta de las instancias.');
  assert.deepEqual(globalMesh.instanceMatrix.array, frozenMatrices);
  assert.deepEqual(globalMesh.instanceColor.array, frozenColors);
  assert.equal(selections.length, selectionCount, 'El comportamiento por distancia no emite estado React por frame.');
  return { far: farBrightness, middle: middleBrightness, near: nearBrightness };
}

module.exports = { validatePickingRays, validateGlobalPicking, validateDistanceBrightness };
