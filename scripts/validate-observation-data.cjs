const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
let three;
const root = path.resolve(__dirname, '../frontend/src');
const settings = { source: 'demo', calls: 0, response: () => Promise.resolve([]) };
let modules = new Map();
function load(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const source = fs.readFileSync(absolute, 'utf8').replaceAll('import.meta.env.VITE_OBSERVATION_DATA_SOURCE', 'settings.source');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  modules.set(absolute, module);
  const requireModule = name => name === 'three' ? three : name === './trendService'
    ? { trendService: { getObservations: (...args) => { settings.calls++; return settings.response(...args); } } }
    : load(path.resolve(path.dirname(absolute), name + '.ts'));
  vm.runInNewContext(compiled, { module, exports: module.exports, require: requireModule, settings,
    DOMException, Promise, Number, Object, Math, Set, Map, WeakMap, Date }, { filename: absolute });
  return module.exports;
}

(async () => {
  three = await import('three');
  const demo = load('services/demo/observationDemoData.ts');
  const scales = load('utils/colorScales.ts');
  const { HEX_GLOBAL_FLAGS } = load('services/demo/hexGlobalCoverage.ts');
  const counts = { Gistemp: 8192, ModisNdvi: 1458, GraceMass: 1662, Oco2: 8192 };
  const landCounts = { ...counts, Gistemp: 1662, Oco2: 1662 };
  for (const variable of Object.keys(counts)) {
    const first = demo.createDemoObservations(variable, 2024);
    const second = demo.createDemoObservations(variable, 2023);
    assert.equal(first.length, counts[variable]);
    assert.equal(new Set(first.map(row => row.id)).size, first.length);
    assert.equal(first.map(row => row.id).join('|'), second.map(row => row.id).join('|'));
    assert(first.some((row, i) => row.value !== second[i].value), 'Year changes must change observed values');
    assert.equal(JSON.stringify(first), JSON.stringify(demo.createDemoObservations(variable, 2024)));
    assert.equal(demo.filterObservationCoverage(first, 'land').length, landCounts[variable]);
    assert.equal(demo.filterObservationCoverage(first, 'global'), first);
    const [min, max] = scales.OBSERVATION_SCALES[variable].domain;
    for (const row of first) {
      const value = scales.getObservationValue(row);
      assert(Number.isFinite(value) && value >= min && value <= max);
      assert.equal(row.timestamp, '2024-07-01T00:00:00.000Z');
      const sampled = demo.sampleDemoObservation(variable, 2024, row.latitude, row.longitude);
      assert.equal(sampled.value, row.value, 'Inspector and visible cell must agree');
      assert.equal(sampled.anomaly, row.anomaly);
      assert.equal(row.unit, scales.OBSERVATION_SCALES[variable].unit);
      assert(!row.unit.includes('/'));
      if (variable === 'ModisNdvi') assert.equal(HEX_GLOBAL_FLAGS[Number(row.id.split(':').at(-1))], '3');
    }
    first[0].value = 999;
    assert.notEqual(demo.createDemoObservations(variable, 2024)[0].value, 999, 'Consumer cannot corrupt cache');
    const target = new three.Color();
    assert.equal(scales.sampleObservationColor(variable, min, target), target);
    assert.equal(target.getHexString(), new three.Color(scales.OBSERVATION_SCALES[variable].stops[0]).getHexString());
    assert.equal(scales.sampleObservationColor(variable, max).getHexString(), new three.Color(scales.OBSERVATION_SCALES[variable].stops[2]).getHexString());
    assert.equal(scales.sampleObservationColor(variable, scales.OBSERVATION_SCALES[variable].midpoint).getHexString(), new three.Color(scales.OBSERVATION_SCALES[variable].stops[1]).getHexString());
    assert.equal(scales.observationMagnitude(variable, max + 1000), 1);
    assert.equal(scales.observationMagnitude(variable, min < 0 ? 0 : min), 0);
    assert.equal(scales.observationMagnitude(variable, min), min < 0 ? 1 : 0);
    assert(scales.observationColorCss(variable, max, 0.5).endsWith(', 0.5)'));
  }
  const foreign = { ...demo.createDemoObservations('Gistemp', 2024)[0] };
  // El contraste no debe invertir el signo, perder la referencia ni alterar alturas.
  let previousBlue = -1, previousRed = -1;
  for (const magnitude of [0.05, 0.25, 0.5, 1, 2]) {
    const cold = scales.sampleObservationColor('Gistemp', -magnitude).getRGB({}, three.SRGBColorSpace);
    const hot = scales.sampleObservationColor('Gistemp', magnitude).getRGB({}, three.SRGBColorSpace);
    const blue = cold.b - cold.r, red = hot.r - hot.b;
    assert(blue > previousBlue && red > previousRed, 'Signed contrast must grow monotonically away from zero');
    previousBlue = blue; previousRed = red;
    assert.equal(scales.observationMagnitude('Gistemp', magnitude), magnitude / 2);
    assert.equal(scales.observationMagnitude('Gistemp', -magnitude), magnitude / 2);
  }
  const moderateCold = scales.sampleObservationColor('Gistemp', -0.5).getRGB({}, three.SRGBColorSpace);
  const moderateHot = scales.sampleObservationColor('Gistemp', 0.5).getRGB({}, three.SRGBColorSpace);
  assert(moderateCold.b - moderateCold.r > 0.25 && moderateHot.r - moderateHot.b > 0.25,
    'Moderate anomalies must read visibly blue/red, not predominantly grey');
  assert.equal(demo.filterObservationCoverage([foreign], 'land').length, 1, 'Never apply demo geography to API/foreign rows, even same ID');
  for (const year of [NaN, 0, 10000, 2024.5]) assert.throws(() => demo.createDemoObservations('Gistemp', year));
  assert.throws(() => demo.sampleDemoObservation('Gistemp', 2024, 91, 0));
  assert.throws(() => scales.sampleObservationColor('Gistemp', NaN));
  const left = demo.sampleDemoObservation('Gistemp', 2024, 15, -180);
  const right = demo.sampleDemoObservation('Gistemp', 2024, 15, 180);
  assert.equal(left.value, right.value, 'Field must wrap continuously at antimeridian');
  let source = load('services/observationDataSource.ts');
  assert.equal((await source.getObservationDataset('Gistemp', 2024)).source, 'demo');
  assert.equal(settings.calls, 0, 'Demo must not query backend');
  settings.source = 'api'; modules = new Map(); source = load('services/observationDataSource.ts');
  const row = { id: 'cell-a', variable: 1, latitude: 4.7, longitude: -74, value: 13.4, anomaly: 0.9, unit: '°C', timestamp: '2024-06-15T00:00:00Z' };
  settings.response = () => Promise.resolve([row]);
  const api = await source.getObservationDataset('Gistemp', 2024);
  assert.equal(api.source, 'api');
  assert.equal(api.observations[0].variable, 'Gistemp');
  assert.equal(scales.getObservationValue(api.observations[0]), 0.9);
  assert.equal(demo.filterObservationCoverage(api.observations, 'land').length, 1);
  const invalidRows = [null, { ...row, latitude: 91 }, { ...row, longitude: -181 }, { ...row, value: NaN },
    { ...row, anomaly: Infinity }, { ...row, variable: 2 }, { ...row, unit: 'NDVI' }, { ...row, timestamp: '2023-01-01T00:00:00Z' },
    { ...row, id: '' }, { ...row, anomaly: undefined }];
  for (const invalid of invalidRows) assert.throws(() => source.adaptApiObservations([invalid], 'Gistemp', 2024));
  assert.throws(() => source.adaptApiObservations([row, row], 'Gistemp', 2024));
  assert.throws(() => source.adaptApiObservations({}, 'Gistemp', 2024));
  assert.equal(source.adaptApiObservations([{ ...row, unit: '°C Anomaly', anomaly: null }], 'Gistemp', 2024)[0].anomaly, undefined);
  settings.response = () => Promise.reject(new Error('API unavailable'));
  await assert.rejects(source.getObservationDataset('Gistemp', 2024), /API unavailable/, 'No silent demo fallback');
  let resolvePending;
  settings.response = () => new Promise(resolve => { resolvePending = resolve; });
  const controller = new AbortController();
  const pending = source.getObservationDataset('Gistemp', 2024, controller.signal);
  controller.abort();
  await assert.rejects(pending, error => error.name === 'AbortError');
  resolvePending([row]);
  const previousCalls = settings.calls;
  await assert.rejects(source.getObservationDataset('Gistemp', 2024, controller.signal), error => error.name === 'AbortError');
  assert.equal(settings.calls, previousCalls);
  settings.source = 'invalid'; modules = new Map(); source = load('services/observationDataSource.ts');
  await assert.rejects(source.getObservationDataset('Gistemp', 2024), /VITE_OBSERVATION_DATA_SOURCE/);
  console.log(JSON.stringify({ status: 'passed', globalCounts: counts, landCounts,
    checks: ['determinism', 'annual-values', 'stable-ids', 'inspector-consistency', 'land-and-ice-mask', 'API-isolation', 'API-contract', 'cancellation', 'color-endpoints'] }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
