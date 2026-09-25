const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const ts = require('typescript');
const root = path.resolve(__dirname, '..', 'frontend/src');
const config = { source: 'demo', profile: 'regional', getTrends: () => Promise.resolve([]) };
const modules = new Map();
function load(file) {
  const absolute = path.resolve(file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const source = fs.readFileSync(absolute, 'utf8').replaceAll('import.meta.env.VITE_HEX_DATA_SOURCE', 'settings.source')
    .replaceAll('import.meta.env.VITE_HEX_DEMO_PROFILE', 'settings.profile');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  modules.set(absolute, module);
  const importModule = (name) => name === './trendService'
    ? { trendService: { getTrends: (...args) => config.getTrends(...args) } }
    : load(path.resolve(path.dirname(absolute), name + '.ts'));
  vm.runInNewContext(compiled, { module, exports: module.exports, require: importModule, settings: config,
    DOMException, Promise, Number, Object, Math, Set }, { filename: absolute });
  return module.exports;
}
const { getHexDataset, adaptApiHexDataset } = load(path.join(root, 'services/hexDataSource.ts'));
const { HEX_DEMO_COVERAGE, DEMO_LAND_CELL_IDS } = load(path.join(root, 'services/demo/hexDemoCoverage.ts'));
const { HEX_GLOBAL_COVERAGE, HEX_GLOBAL_FLAGS } = load(path.join(root, 'services/demo/hexGlobalCoverage.ts'));
const filter = { variable: 'Gistemp', startYear: 2002, endYear: 2024 };
function distance(a, b) {
  const radians = Math.PI / 180;
  const lat1 = a.latitude * radians;
  const lat2 = b.latitude * radians;
  const latDelta = lat2 - lat1;
  const lngDelta = (b.longitude - a.longitude) * radians;
  return 2 * Math.asin(Math.sqrt(Math.sin(latDelta / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(lngDelta / 2) ** 2)) / radians;
}
(async () => {
  const first = await getHexDataset(filter);
  config.profile = 'stress';
  const stress = await getHexDataset(filter);
  assert.equal(stress.cells.length, 6211);
  assert.equal(new Set(stress.cells.map(cell => cell.id)).size, 6211);
  assert(stress.cells.every(cell => Math.abs(cell.slope) <= stress.heightDomain && distance(cell, {latitude:18,longitude:-12}) < 34));
  assert.equal(JSON.stringify(stress), JSON.stringify(await getHexDataset(filter)));
  const stressReference = JSON.stringify(stress);
  const stressIds = stress.cells.map(c => c.id).join('|');
  for (const variable of ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2']) {
    const stressVariable = await getHexDataset({ ...filter, variable });
    assert.equal(stressVariable.cells.length, 6211, 'Load-only profile must not filter by scientific variable');
    assert.equal(stressVariable.cells.map(c => c.id).join('|'), stressIds);
  }
  stress.cells[0].latitude = 0;
  stress.cells[0].slope = 999;
  stress.cells.pop();
  assert.equal(JSON.stringify(await getHexDataset(filter)), stressReference, 'Consumers must not mutate the geography cache');
  config.profile = 'invalid';
  await assert.rejects(getHexDataset(filter), /VITE_HEX_DEMO_PROFILE/);
  config.profile = 'regional';
  assert.equal(first.cells.length, 728);
  assert.equal(first.source, 'demo');
  assert.equal(JSON.stringify(first), JSON.stringify(await getHexDataset(filter)));
  const geometryFingerprint = first.cells.map(c => `${c.id},${c.latitude.toFixed(8)},${c.longitude.toFixed(8)}`).join('\n');
  assert.equal(createHash('sha256').update(geometryFingerprint).digest('hex'), HEX_DEMO_COVERAGE.regionalLayoutSha256,
    'Regenerate demo coverage when regional centers change');
  const maskFile = path.resolve(root, '../public/earth/masks/modis-water-2k.png');
  assert.equal(createHash('sha256').update(fs.readFileSync(maskFile)).digest('hex'), HEX_DEMO_COVERAGE.maskSha256,
    'Regenerate demo coverage when the water mask changes');
  const allIds = new Set(first.cells.map(c => c.id));
  const landIds = new Set(DEMO_LAND_CELL_IDS);
  assert.equal(landIds.size, HEX_DEMO_COVERAGE.landCells);
  assert([...landIds].every(id => allIds.has(id) && !id.startsWith('demo:pacific:')));
  let minDistance = Infinity;
  for (let i = 0; i < first.cells.length; i++) {
    for (let j = i + 1; j < first.cells.length; j++) {
      minDistance = Math.min(minDistance, distance(first.cells[i], first.cells[j]));
    }
  }
  assert(minDistance > 2.18, String(minDistance));
  const ids = first.cells.map(c => c.id).join('|');
  const countsByVariable = {};
  for (const variable of ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2']) {
    const initial = await getHexDataset({ ...filter, variable });
    const future = await getHexDataset({ ...filter, variable, endYear: 2026 });
    countsByVariable[variable] = initial.cells.length;
    assert.equal(initial.cells.map(c => c.id).join('|'), future.cells.map(c => c.id).join('|'));
    if (variable === 'ModisNdvi' || variable === 'GraceMass') {
      assert(initial.cells.every(c => landIds.has(c.id)), 'Continental variables must use the coastal guard');
      assert.equal(initial.cells.length, variable === 'ModisNdvi' ? HEX_DEMO_COVERAGE.vegetationCells : HEX_DEMO_COVERAGE.landCells);
      if (variable === 'ModisNdvi') assert(initial.cells.every(c => !c.id.startsWith('demo:greenland:')));
    } else {
      assert.equal(initial.cells.map(c => c.id).join('|'), ids);
      assert(initial.cells.some(c => c.id.startsWith('demo:pacific:')), 'Ocean-capable variables preserve Pacific samples');
    }
    assert.equal(initial.heightDomain, future.heightDomain);
    assert(initial.cells.some(c => c.slope < 0));
    assert(initial.cells.some(c => c.slope > 0));
    assert(initial.cells.every(c => Number.isFinite(c.slope) && Math.abs(c.slope) <= initial.heightDomain));
    assert.notEqual(JSON.stringify(initial.cells), JSON.stringify(future.cells));
  }
  config.profile = undefined;
  const global = await getHexDataset(filter);
  assert.equal(global.cells.length, 8192, 'Default profile must cover the globe');
  assert.equal(HEX_GLOBAL_FLAGS.length, global.cells.length);
  assert.equal(new Set(global.cells.map(c => c.id)).size, 8192);
  assert(global.cells[0].latitude > 89 && global.cells.at(-1).latitude < -89);
  const globalLayout = global.cells.map((c, i) => `${i},${c.latitude.toFixed(8)},${c.longitude.toFixed(8)}`).join('\n');
  assert.equal(createHash('sha256').update(globalLayout).digest('hex'), HEX_GLOBAL_COVERAGE.layoutSha256);
  for (let longitude = -180; longitude < 180; longitude += 30) {
    assert(global.cells.some(c => c.longitude >= longitude && c.longitude < longitude + 30 && Math.abs(c.latitude) < 15));
  }
  let globalMinDistance = Infinity;
  for (let i = 0; i < 64; i++) {
    for (let j = i + 1; j < global.cells.length; j++) globalMinDistance = Math.min(globalMinDistance, distance(global.cells[i], global.cells[j]));
  }
  assert(globalMinDistance > 1.8, 'Global centers must not crowd near the poles');
  const globalCounts = {};
  for (const variable of ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2']) {
    const dataset = await getHexDataset({ ...filter, variable });
    globalCounts[variable] = dataset.cells.length;
    assert.equal(JSON.stringify(dataset), JSON.stringify(await getHexDataset({ ...filter, variable })));
    const nextYear = await getHexDataset({ ...filter, variable, endYear: 2025 });
    assert.equal(dataset.cells.map(c => c.id).join('|'), nextYear.cells.map(c => c.id).join('|'));
    assert.notEqual(JSON.stringify(dataset.cells), JSON.stringify(nextYear.cells));
    assert(dataset.cells.some(c => c.slope < 0) && dataset.cells.some(c => c.slope > 0));
    assert(dataset.cells.every(c => Number.isFinite(c.slope) && Math.abs(c.slope) <= dataset.heightDomain));
    if (variable === 'ModisNdvi' || variable === 'GraceMass') {
      assert.equal(dataset.cells.length, variable === 'ModisNdvi' ? HEX_GLOBAL_COVERAGE.vegetationCells : HEX_GLOBAL_COVERAGE.landCells);
      assert(dataset.cells.every(c => {
        const flag = Number(HEX_GLOBAL_FLAGS[Number(c.id.split(':').at(-1))]);
        return variable === 'ModisNdvi' ? flag === 3 : (flag & 1) !== 0;
      }));
      for (const center of [{latitude:4.7,longitude:-74}, {latitude:40,longitude:-100}, {latitude:50,longitude:15},
        {latitude:-15,longitude:25}, {latitude:35,longitude:100}, {latitude:-25,longitude:135}]) {
        assert(dataset.cells.some(c => distance(c, center) < 5), 'Missing continental coverage');
      }
    } else assert.equal(dataset.cells.length, 8192);
  }
  global.cells[0].latitude = 0;
  assert((await getHexDataset(filter)).cells[0].latitude > 89, 'Global cache must be isolated from consumers');
  const row = { variable: 'Gistemp', latitude: 4.711, longitude: -74.0721, startYear: 2002, endYear: 2024, sensSlope: 0.025 };
  const api = adaptApiHexDataset([row], filter);
  assert.equal(api.cells[0].slope, row.sensSlope);
  assert.equal(api.unit, 'pendiente · unidad no declarada');
  assert.equal(api.source, 'api');
  assert.equal(api.heightDomain, 1);
  assert.equal(adaptApiHexDataset([{ ...row, variable: 1 }], filter).cells.length, 1);
  assert.throws(() => adaptApiHexDataset([{ ...row, variable: 2 }], filter));
  const envelope = adaptApiHexDataset({ cells: [row], variable: 1, unit: '°C / década', heightDomain: 0.5,
    resolutionDegrees: 1 }, filter);
  assert.equal(envelope.unit, '°C / década');
  assert.equal(envelope.heightDomain, 0.5);
  assert.equal(envelope.resolutionDegrees, 1);
  assert.throws(() => adaptApiHexDataset({ cells: [row], heightDomain: -1 }, filter));
  assert.throws(() => adaptApiHexDataset([{ ...row, unit: '°C / año' }, { ...row, latitude: 5 }], filter));
  assert.throws(() => adaptApiHexDataset([{ ...row, resolutionDegrees: 1 }, { ...row, latitude: 5 }], filter));
  assert.equal(adaptApiHexDataset([], filter).cells.length, 0);
  for (const patch of [{ latitude: 91 }, { longitude: -181 }, { sensSlope: NaN }, { sensSlope: Infinity },
    { sensSlope: '0.25' }, { variable: 'ModisNdvi' }, { endYear: 2025 }, { resolutionDegrees: 0 }, { unit: '' }]) {
    assert.throws(() => adaptApiHexDataset([{ ...row, ...patch }], filter));
  }
  assert.throws(() => adaptApiHexDataset([row, row], filter));
  assert.throws(() => adaptApiHexDataset({}, filter));
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(getHexDataset(filter, controller.signal), { name: 'AbortError' });
  config.source = 'api';
  let resolveRequest;
  config.getTrends = () => new Promise(resolve => { resolveRequest = resolve; });
  const runningController = new AbortController();
  const request = getHexDataset(filter, runningController.signal);
  runningController.abort();
  resolveRequest([row]);
  await assert.rejects(request, { name: 'AbortError' });
  config.getTrends = () => Promise.reject(new Error('servidor de prueba no disponible'));
  await assert.rejects(getHexDataset(filter), /servidor de prueba no disponible/);
  config.source = 'invalid';
  await assert.rejects(getHexDataset(filter), /VITE_HEX_DATA_SOURCE/);
  console.log(JSON.stringify({ result: 'PASS', cells: first.cells.length, minAngularSeparation: minDistance,
    countsByVariable, globalCounts, globalMinDistance, stressCells: 6211, checks: ['global default', 'global coast/ice flags',
      'global layout fingerprint', 'all longitudes and continental regions', 'polar spacing',
      'determinism', '6211 stress cells for every variable', 'isolated cached results',
      'coverage mask hash', 'generated geography fingerprint', 'continental variable coverage',
      'vegetation excludes Greenland', 'ocean samples for temperature and CO2',
      'stable IDs', 'stable domains', 'signed finite slopes', 'dates change magnitude',
      'API without confidenceInterval95', 'numeric API enums', 'API scale independent of demo',
      'envelope metadata', 'partial metadata rejection', 'invalid coordinates', 'duplicate locations', 'invalid metadata',
      'empty response', 'abort before request', 'abort during request', 'no silent demo fallback', 'invalid configuration'] }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
