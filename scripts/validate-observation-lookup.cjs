const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '../frontend/src');
const cache = new Map();
function load(file) {
  const absolute = path.resolve(root, file);
  if (cache.has(absolute)) return cache.get(absolute).exports;
  const source = fs.readFileSync(absolute, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const module = { exports: {} };
  cache.set(absolute, module);
  vm.runInNewContext(compiled, { module, exports: module.exports,
    require: name => load(path.resolve(path.dirname(absolute), name + '.ts')), Math, Number, WeakMap }, { filename: absolute });
  return module.exports;
}
const { findNearbyObservation, angularDistanceDegrees } = load('utils/observationLookup.ts');
const { createDemoObservations, filterObservationCoverage } = load('services/demo/observationDemoData.ts');
const observation = (id, latitude, longitude, variable = 'Gistemp') => ({ id, variable, latitude, longitude,
  value: 0.4, anomaly: 0.4, timestamp: '2024-07-01T00:00:00Z', unit: '°C' });
const choose = (rows, lat, lng, variable = 'Gistemp') => findNearbyObservation(rows, { lat, lng }, variable, 4);
const exact = observation('exact', 18.4321, -12.1234);
assert.equal(choose([exact], exact.latitude, exact.longitude).observation, exact);
assert.equal(choose([exact], exact.latitude, exact.longitude).distanceDegrees, 0);
assert.equal(choose([observation('farther', 0, 3), observation('closer', 0, 1)], 0, 0).observation.id, 'closer');
assert.equal(choose([observation('seam', 0, -179.5)], 0, 179.5).observation.id, 'seam');
assert(Math.abs(angularDistanceDegrees({ lat: 0, lng: -179.5 }, { lat: 0, lng: 179.5 }) - 1) < 1e-10);
assert.equal(choose([observation('pole', 89, -179)], 89, 1).observation.id, 'pole');
assert(angularDistanceDegrees({ lat: 90, lng: 0 }, { lat: 90, lng: 180 }) < 1e-10);
assert.equal(choose([observation('outside', 0, 4.0001)], 0, 0), null);
assert.equal(choose([observation('edge', 0, 4)], 0, 0), null);
assert.equal(choose([observation('wrong-variable', 0, 0, 'ModisNdvi')], 0, 0), null);
assert.equal(choose([observation('invalid', NaN, 0)], 0, 0), null);
assert.equal(choose([], 0, 0), null);
assert.equal(choose([exact], 91, 0), null);
assert.equal(findNearbyObservation([exact], null, 'Gistemp', 4), null);
assert.throws(() => findNearbyObservation([exact], { lat: 0, lng: 0 }, 'Gistemp', NaN));
const ndvi = createDemoObservations('ModisNdvi', 2024);
assert.equal(choose(ndvi, 0, -140, 'ModisNdvi'), null, 'Ocean click must not invent an NDVI series');
assert.equal(choose(ndvi, 75, -42, 'ModisNdvi'), null, 'Mapped ice remains outside NDVI coverage');
const land = filterObservationCoverage(createDemoObservations('Gistemp', 2024), 'land');
assert.equal(choose(land, 0, -140), null, 'Continental view must not sample globally behind the filter');
assert(choose(createDemoObservations('Gistemp', 2024), 0, -140), 'Ocean observations are allowed only in the global dataset');
console.log(JSON.stringify({ status: 'passed', checks: ['exact-cell', 'nearest-within-support', 'antimeridian', 'poles',
  'outside-support', 'wrong-variable', 'NDVI-ocean-and-ice', 'active-coverage-only'] }, null, 2));
