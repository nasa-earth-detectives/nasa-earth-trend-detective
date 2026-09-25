const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const ts = require('typescript');

async function main() {
  const three = await import('three');
  const root = path.resolve(__dirname, '../frontend/src');
  const modules = new Map();
  let clock = 1000;
  let reducedMotion = false;
  let useWorker = false;
  const workers = [];
  class FakeWorker {
    constructor() { this.messages = []; this.terminated = false; workers.push(this); }
    postMessage(message) { this.messages.push(message); }
    terminate() { this.terminated = true; }
  }
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8').replaceAll('import.meta.url', "'file:///test'"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
      module, exports: module.exports, performance: { now: () => clock },
      URL, get Worker() { return useWorker ? FakeWorker : undefined; },
      window: { matchMedia: () => ({ get matches() { return reducedMotion; } }) },
      require: name => name === 'three' ? three : load(path.resolve(path.dirname(file), name + '.ts')),
    }, { filename: file });
    return module.exports;
  }
  const { rasterizeEarthHeat, observationHeatStrength } = load(path.join(root, 'components/Globe/earthHeatRaster.ts'));
  const { createEarthHeatLayer } = load(path.join(root, 'components/Globe/earthHeatLayer.ts'));
  const { acquireEarthAnalysisRoot } = load(path.join(root, 'components/Globe/earthAnalysisRoot.ts'));
  const { createDemoObservations, filterObservationCoverage } = load(path.join(root, 'services/demo/observationDemoData.ts'));
  const observation = (lat, lng, value, variable = 'Gistemp') => ({
    id: `${lat}:${lng}:${value}`, latitude: lat, longitude: lng, value, variable,
    timestamp: '2024-07-01T00:00:00Z', unit: 'test',
  });
  const pixel = (raster, lat, lng) => Math.min(raster.height - 1, Math.floor((lat + 90) / 180 * raster.height))
    * raster.width + Math.floor((((lng + 180) % 360 + 360) % 360) / 360 * raster.width);
  const data = [observation(0, -1, -2), observation(0, 1, 2)];
  const signed = rasterizeEarthHeat(data, 'Gistemp');
  assert(signed.values[pixel(signed, 0, -1)] < 0);
  assert(signed.values[pixel(signed, 0, 1)] > 0);
  assert.equal(signed.coverage[pixel(signed, 0, 40)], 0, 'No rellena océanos alejados de muestras.');
  assert(Number.isNaN(signed.values[pixel(signed, 0, 40)]));
  const duplicated = rasterizeEarthHeat([...data, data[0], data[0]], 'Gistemp');
  assert.deepEqual([...duplicated.pixels], [...signed.pixels], 'Repetir ubicación no convierte el mapa en densidad.');
  const neutral = rasterizeEarthHeat([observation(0, 0, -2), observation(0, 0, 2)], 'Gistemp');
  assert.equal(neutral.values[pixel(neutral, 0, 0)], 0, 'Las anomalías opuestas se compensan sin abs.');
  const warm = rasterizeEarthHeat([observation(0, 0, 2)], 'Gistemp');
  assert.deepEqual([...neutral.coverage], [...warm.coverage], 'La fuerza visual no cambia la cobertura geográfica.');
  const neutralAlpha = neutral.pixels[pixel(neutral, 0, 0) * 4 + 3];
  const warmAlpha = warm.pixels[pixel(warm, 0, 0) * 4 + 3];
  assert(neutralAlpha > 0 && neutralAlpha < warmAlpha * 0.16, 'La referencia cero no cubre la Tierra con gris opaco.');
  assert.equal(observationHeatStrength('Gistemp', -1), observationHeatStrength('Gistemp', 1));
  assert.equal(observationHeatStrength('GraceMass', -15), observationHeatStrength('GraceMass', 15));
  assert.equal(observationHeatStrength('Gistemp', 20), 1);
  assert.equal(observationHeatStrength('ModisNdvi', 0.1), observationHeatStrength('ModisNdvi', 0.9));
  assert.equal(observationHeatStrength('Oco2', 380), observationHeatStrength('Oco2', 440));
  const seam = rasterizeEarthHeat([observation(0, 180, 1.3)], 'Gistemp');
  const row = Math.floor(seam.height / 2);
  assert(seam.coverage[row * seam.width] > 0);
  assert(Math.abs(seam.coverage[row * seam.width] - seam.coverage[row * seam.width + seam.width - 1]) < 1e-6);
  const north = rasterizeEarthHeat([observation(90, 0, -1)], 'Gistemp');
  const south = rasterizeEarthHeat([observation(-90, 0, 1)], 'Gistemp');
  for (let column = 0; column < north.width; column++) {
    assert(north.coverage[(north.height - 1) * north.width + column] > 0);
    assert.equal(north.values[(north.height - 1) * north.width + column], -1);
    assert.equal(south.values[column], 1);
  }
  const invalid = rasterizeEarthHeat([observation(NaN, 0, 1), observation(91, 0, 1),
    observation(0, 0, Infinity), observation(0, 0, 0.5, 'ModisNdvi')], 'Gistemp');
  assert(invalid.coverage.every(value => value === 0));
  const anomaly = rasterizeEarthHeat([{ ...observation(0, 0, 99), anomaly: -0.7 }], 'Gistemp');
  assert(Math.abs(anomaly.values[pixel(anomaly, 0, 0)] + 0.7) < 1e-6);

  const scene = new three.Scene();
  let created = 0;
  let cleared = 0;
  const globe = {
    getGlobeRadius: () => 100,
    customThreeObject(factory) { scene.add(factory()); created++; return this; },
    customThreeObjectUpdate() { return this; },
    customLayerData(data) { if (!data.length) cleared++; return this; },
  };
  const shared = acquireEarthAnalysisRoot(globe);
  const layer = createEarthHeatLayer(globe);
  assert.equal(created, 1, 'Una raíz, sin otro renderer ni canvas.');
  const mesh = scene.getObjectByName('earth-observation-heat');
  const uniforms = mesh.material.uniforms;
  const textures = [uniforms.previousMap.value, uniforms.currentMap.value];
  const versions = textures.map(texture => texture.version);
  layer.updateData(data, 'Gistemp');
  assert.deepEqual(textures.map(texture => texture.version), versions, 'No calcula/sube raster estando oculta.');
  layer.setVisible(true);
  assert.equal(uniforms.progress.value, 0);
  clock += 400;
  mesh.onBeforeRender();
  assert.equal(uniforms.progress.value, 0.5);
  const firstMap = new Uint8Array(textures[1].image.data);
  layer.updateData(data.map(item => ({ ...item, value: -item.value })), 'Gistemp');
  for (let index = 0; index < firstMap.length; index++) {
    assert(Math.abs(textures[0].image.data[index] - firstMap[index] * 0.5) <= 1);
  }
  clock += 800;
  mesh.onBeforeRender();
  assert.equal(uniforms.progress.value, 1);
  const stableVersions = textures.map(texture => texture.version);
  for (let frame = 0; frame < 120; frame++) { clock += 16; mesh.onBeforeRender(); }
  assert.deepEqual(textures.map(texture => texture.version), stableVersions, 'No sube texturas por frame.');
  assert.equal(scene.getObjectByName('earth-observation-heat'), mesh);
  assert.equal(textures[0].colorSpace, three.NoColorSpace);
  assert.equal(textures[0].wrapS, three.RepeatWrapping);
  reducedMotion = true;
  layer.updateData(data, 'Gistemp');
  assert.equal(uniforms.progress.value, 1);
  let disposed = 0;
  for (const resource of [...textures, mesh.geometry, mesh.material]) resource.addEventListener('dispose', () => disposed++);
  layer.dispose();
  layer.dispose();
  assert.equal(disposed, 4);
  assert.equal(cleared, 0, 'Cerrar calor no destruye la raíz que usan hexágonos.');
  shared.release();
  assert.equal(cleared, 1);
  assert.equal(scene.children.length, 0);

  useWorker = true;
  const asynchronous = createEarthHeatLayer(globe);
  asynchronous.updateData(data, 'Gistemp');
  asynchronous.setVisible(true);
  const worker = workers[0];
  const asyncMesh = scene.getObjectByName('earth-observation-heat');
  const asyncMap = asyncMesh.material.uniforms.currentMap.value;
  const initialVersion = asyncMap.version;
  assert.equal(worker.messages.length, 1);
  asynchronous.updateData([observation(0, 0, -1.5)], 'Gistemp');
  asynchronous.updateData([observation(0, 0, 1.8)], 'Gistemp');
  assert.equal(worker.messages.length, 1, 'No acumula años intermedios en la cola del worker.');
  const respond = request => worker.onmessage({ data: { id: request.id,
    pixels: rasterizeEarthHeat(request.observations, request.variable).pixels } });
  respond(worker.messages[0]);
  assert.equal(asyncMap.version, initialVersion, 'Descarta la respuesta de un año anterior.');
  assert.equal(worker.messages.length, 2);
  assert.equal(worker.messages[1].observations[0].value, 1.8);
  respond(worker.messages[1]);
  assert.equal(asyncMap.version, initialVersion + 1);
  asynchronous.dispose();
  assert(worker.terminated, 'Libera también el worker.');
  respond(worker.messages[1]);
  assert.equal(asyncMap.version, initialVersion + 1, 'No aplica respuestas después de desmontar.');

  const timings = {};
  for (const variable of ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2']) {
    const samples = filterObservationCoverage(createDemoObservations(variable, 2024), 'land');
    const started = performance.now();
    const result = rasterizeEarthHeat(samples, variable);
    timings[variable] = { samples: samples.length, rasterMs: +(performance.now() - started).toFixed(1),
      coveredPixels: result.coverage.filter(value => value > 0).length };
    assert(result.coverage[pixel(result, 0, -145)] === 0, 'El Pacífico central permanece sin falsa cobertura terrestre.');
  }
  console.log(JSON.stringify({ result: 'PASS', timings, checks: [
    'signed normalized means', 'duplicate location invariance', 'zero preserved', 'anomaly preferred',
    'transparent divergence reference without changing geographic coverage', 'equal strength for both signs',
    'sequential scale opacity independent of value',
    'bounded support and no distant ocean coverage', 'antimeridian continuity', 'both polar caps',
    'invalid and different-variable samples ignored', 'shared globe root', 'lazy hidden raster',
    '800ms transition', 'interrupted transition continuity', 'no frame texture upload',
    'linear color and repeat longitude', 'reduced motion', 'independent idempotent disposal',
    'worker queue coalescing', 'stale year discarded', 'worker lifetime and late response disposal',
  ] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
