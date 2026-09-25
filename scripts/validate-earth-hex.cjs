const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

async function main() {
  const three = await import('three');
  const root = path.resolve(__dirname, '../frontend/src');
  const modules = new Map();
  let clock = 0;
  let reducedMotion = false;
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
      module, exports: module.exports, performance: { now: () => clock },
      window: { matchMedia: () => ({ get matches() { return reducedMotion; } }) },
      require: name => name === 'three' ? three : load(path.resolve(path.dirname(file), name + '.ts')),
    }, { filename: file });
    return module.exports;
  }
  const { createEarthHexLayer } = load(path.join(root, 'components/Globe/earthHexLayer.ts'));
  const { acquireEarthAnalysisRoot } = load(path.join(root, 'components/Globe/earthAnalysisRoot.ts'));
  const { sampleObservationColor, observationMagnitude } = load(path.join(root, 'utils/colorScales.ts'));
  const { HEX_COLUMN_CONFIG } = load(path.join(root, 'components/Globe/hexColumns.ts'));
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(50, 1920 / 1080, 1, 10000);
  camera.position.set(0, 0, 300);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const listeners = new Map();
  const canvas = {
    style: { cursor: '' },
    addEventListener: (name, handler) => listeners.set(name, handler),
    removeEventListener: name => listeners.delete(name),
    getBoundingClientRect: () => ({ width: 1920, height: 1080, left: 0, top: 0 }),
  };
  const renderer = { domElement: canvas };
  let rootsCreated = 0;
  let rootsCleared = 0;
  let coordCalls = 0;
  const globe = {
    getGlobeRadius: () => 100, renderer: () => renderer, camera: () => camera, scene: () => scene,
    customThreeObject(factory) { scene.add(factory()); rootsCreated++; return this; },
    customThreeObjectUpdate() { return this; },
    customLayerData(data) { if (!data.length) rootsCleared++; return this; },
    getCoords(lat, lng) {
      coordCalls++;
      const phi = lat * Math.PI / 180;
      const theta = lng * Math.PI / 180;
      return { x: 100 * Math.cos(phi) * Math.sin(theta), y: 100 * Math.sin(phi), z: 100 * Math.cos(phi) * Math.cos(theta) };
    },
  };
  const locations = [];
  const readings = [];
  const layer = createEarthHexLayer(globe, location => locations.push(location));
  layer.setOnObservationSelect(observation => readings.push(observation));
  const shared = acquireEarthAnalysisRoot(globe);
  assert.equal(rootsCreated, 1, 'Hex y calor comparten una única raíz pública.');
  const observations = [-1, 0.5, 1.8].map((value, index) => ({
    id: `cell:${index}`, variable: 'Gistemp', latitude: index * 4, longitude: (index - 1) * 12,
    value, anomaly: value, unit: '°C', timestamp: '2024-01-01T00:00:00Z',
  }));
  function frame(ms) {
    clock += ms;
    scene.updateMatrixWorld(true);
    scene.onBeforeRender(renderer, scene, camera, null, null, null);
  }
  layer.updateData(observations, 'Gistemp');
  const mesh = scene.getObjectByName('earth-analysis-hex-columns');
  assert(mesh.isInstancedMesh);
  assert.equal(mesh.count, 3);
  assert.equal(locations.length, 0);
  frame(800);
  const matrix = new three.Matrix4();
  const color = new three.Color();
  function height(index) {
    mesh.getMatrixAt(index, matrix);
    return Math.hypot(matrix.elements[4], matrix.elements[5], matrix.elements[6]);
  }
  function rgba(index) { mesh.getColorAt(index, color); return color.toArray(); }
  const expectedHeight = observationMagnitude('Gistemp', observations[0].anomaly) * 100 * HEX_COLUMN_CONFIG.maxHeightRatio;
  assert(Math.abs(height(0) - expectedHeight) < 1e-6);
  layer.select('cell:0');
  assert.equal(readings.at(-1), observations[0]);
  assert.deepEqual({ ...locations.at(-1) }, { lat: observations[0].latitude, lng: observations[0].longitude });
  const next = observations.map(observation => ({ ...observation, value: -observation.value * 0.6,
    anomaly: -observation.anomaly * 0.6, timestamp: '2025-01-01T00:00:00Z' }));
  const oldHeight = height(1);
  const oldColor = rgba(1);
  const buffer = mesh.instanceMatrix.array;
  layer.updateData(next, 'Gistemp');
  assert.equal(readings.at(-1), next[0]);
  assert.equal(locations.length, 1, 'Un cambio de año actualiza lectura sin abrir inspector.');
  assert.equal(mesh, scene.getObjectByName('earth-analysis-hex-columns'));
  assert.equal(buffer, mesh.instanceMatrix.array);
  assert.equal(coordCalls, 3, 'Año nuevo conserva coordenadas y BVH.');
  assert.equal(height(1), oldHeight);
  assert.deepEqual(rgba(1), oldColor, 'Color comienza desde el estado visual previo.');
  frame(400);
  const halfwayHeight = height(1);
  const halfwayColor = rgba(1);
  assert.notEqual(halfwayHeight, oldHeight);
  assert.notDeepEqual(halfwayColor, oldColor);
  frame(400);
  assert.notEqual(height(1), halfwayHeight);
  assert.notDeepEqual(rgba(1), halfwayColor);
  const expectedColor = sampleObservationColor('Gistemp', next[1].anomaly);
  mesh.getColorAt(1, color);
  assert(color.distanceTo ? color.distanceTo(expectedColor) < 1e-6
    : Math.abs(color.r - expectedColor.r) + Math.abs(color.g - expectedColor.g) + Math.abs(color.b - expectedColor.b) < 1e-6);
  const matrixVersion = mesh.instanceMatrix.version;
  const colorVersion = mesh.instanceColor.version;
  const readingCount = readings.length;
  for (let index = 0; index < 60; index++) frame(16.7);
  assert.equal(mesh.instanceMatrix.version, matrixVersion);
  assert.equal(mesh.instanceColor.version, colorVersion);
  assert.equal(readings.length, readingCount, 'Sin estado React por frame.');
  mesh.getMatrixAt(2, matrix);
  const point = new three.Vector3(0, 0.5, 0).applyMatrix4(matrix).applyMatrix4(mesh.matrixWorld).project(camera);
  assert(layer.pick((point.x + 1) / 2 * 1920, (1 - point.y) / 2 * 1080));
  assert.equal(readings.at(-1), next[2]);
  assert.deepEqual({ ...locations.at(-1) }, { lat: next[2].latitude, lng: next[2].longitude });
  layer.setVisible(false);
  assert.equal(mesh.visible, false);
  const locationCount = locations.length;
  assert.equal(layer.pick(960, 540), false);
  assert.equal(locations.length, locationCount);
  layer.setVisible(true);
  reducedMotion = true;
  layer.updateData([
    { ...observations[0], variable: 'Oco2', value: 420, anomaly: 123, unit: 'ppm' },
    { ...observations[1], variable: 'Oco2', latitude: NaN },
    { ...observations[2], variable: 'Gistemp' },
  ], 'Oco2');
  assert.equal(mesh.count, 1, 'Rechaza coordenadas inválidas y observaciones de otra variable.');
  const co2Height = observationMagnitude('Oco2', 420) * 100 * HEX_COLUMN_CONFIG.maxHeightRatio;
  assert(Math.abs(height(0) - co2Height) < 1e-5, 'CO₂ usa concentración absoluta y no una anomalía accidental.');
  assert.equal(globe.renderer(), renderer);
  assert.equal(globe.renderer().domElement, canvas);
  let materialDisposed = false;
  let geometryDisposed = false;
  mesh.material.addEventListener('dispose', () => { materialDisposed = true; });
  mesh.geometry.addEventListener('dispose', () => { geometryDisposed = true; });
  layer.dispose();
  layer.dispose();
  assert(materialDisposed && geometryDisposed);
  assert.equal(listeners.size, 0);
  assert.equal(rootsCleared, 0, 'Disponer hex no elimina la capa de calor.');
  assert.equal(scene.getObjectByName('earth-analysis-hex-columns'), undefined);
  shared.release();
  assert.equal(rootsCleared, 1);
  assert.equal(scene.getObjectByName('earth-analysis-root'), undefined);
  console.log(JSON.stringify({ result: 'PASS', checks: [
    'annual observations', 'exact coordinate selection', 'selection across years', 'height/color interpolation over 800ms',
    'same mesh and matrix buffer', 'cached geography', 'no frame state updates', 'reduced motion', 'invalid input filtering',
    'CO2 concentration semantics', 'same canvas and renderer', 'shared analysis root', 'independent disposal',
  ] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
