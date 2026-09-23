const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');

const file = path.resolve(__dirname, '../frontend/src/components/Globe/solarPosition.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const solarModule = { exports: {} };
vm.runInNewContext(compiled, { module: solarModule, exports: solarModule.exports }, { filename: file });
const { getSubsolarPoint } = solarModule.exports;
const radians = degrees => degrees * Math.PI / 180;
const angleDifference = (a, b) => ((a - b + 540) % 360) - 180;
const solarAltitude = (point, lat, lng) => Math.asin(
  Math.sin(radians(lat)) * Math.sin(radians(point.lat))
  + Math.cos(radians(lat)) * Math.cos(radians(point.lat)) * Math.cos(radians(lng - point.lng)),
) * 180 / Math.PI;

// Independent almanac fixtures retrieved 2026-09-23 from USNO API v4.0.1.
// API provides solar declination and west-positive Greenwich Hour Angle;
// subsolar longitude is -GHA modulo 360. Tests run offline, never fetch data.
// https://aa.usno.navy.mil/api/celnav?date=YYYY-MM-DD&time=HH:MM:SS&coords=LAT,LNG
// https://aa.usno.navy.mil/data/api#celnav
const references = [
  { date: '2026-03-20T14:46:00Z', dec: 0.000140, gha: 39.649273, coords: '0,-40' },
  { date: '2026-06-21T08:24:00Z', dec: 23.437933, gha: 305.553751, coords: '23,54' },
  { date: '2026-09-23T02:06:00Z', dec: -0.032681, gha: 213.370533, coords: '0,140' },
  { date: '2026-09-23T17:00:00Z', dec: -0.274252, gha: 76.925152, coords: '0,-75' },
  { date: '2026-12-21T20:50:00Z', dec: -23.437415, gha: 132.938136, coords: '-23,-130' },
];
for (const reference of references) {
  const actual = getSubsolarPoint(Date.parse(reference.date));
  assert(Math.abs(actual.lat - reference.dec) < 0.03, `${reference.date}: latitude must agree with USNO within 0.03°`);
  assert(Math.abs(angleDifference(actual.lng, -reference.gha)) < 0.03, `${reference.date}: longitude must agree with USNO within 0.03°`);
}

// Independent season instants from https://aa.usno.navy.mil/api/seasons?year=2026.
for (const date of ['2026-03-20T14:46:00Z', '2026-09-23T00:05:00Z']) {
  assert(Math.abs(getSubsolarPoint(Date.parse(date)).lat) < 0.03, 'Equinox Sun must be over the equator');
}
assert(Math.abs(getSubsolarPoint(Date.parse('2026-06-21T08:24:00Z')).lat - 23.438) < 0.03);
assert(Math.abs(getSubsolarPoint(Date.parse('2026-12-21T20:50:00Z')).lat + 23.438) < 0.03);

const colombiaNight = getSubsolarPoint(Date.parse('2026-09-23T02:06:00Z'));
const colombiaNoon = getSubsolarPoint(Date.parse('2026-09-23T17:00:00Z'));
// Bogotá: September 22 at 21:06 local (UTC-5); September 23 at 12:00 local.
assert(solarAltitude(colombiaNight, 4.711, -74.0721) < -40, 'Colombia at 21:06 must be well into night');
assert(solarAltitude(colombiaNoon, 4.711, -74.0721) > 80, 'Colombia at noon must face the Sun');
for (const timestamp of [
  '2026-09-22T21:06:00-05:00', '2026-09-23T02:06:00Z', '2026-09-23T11:06:00+09:00',
]) {
  assert.equal(JSON.stringify(getSubsolarPoint(Date.parse(timestamp))), JSON.stringify(colombiaNight), 'Same instant in different time zones must produce the same sunlight');
}

// A full day follows the globe smoothly westward, including the antimeridian
// and UTC midnight. Solar and sidereal days must not be confused.
const start = Date.parse('2026-09-22T00:00:00Z');
let previous = getSubsolarPoint(start);
let crossedAntimeridian = false;
for (let minute = 1; minute <= 1_440; minute++) {
  const current = getSubsolarPoint(start + minute * 60_000);
  assert(current.lng >= -180 && current.lng < 180);
  assert(current.lat >= -23.5 && current.lat <= 23.5);
  const movement = angleDifference(current.lng, previous.lng);
  assert(movement > -0.251 && movement < -0.249, 'Sun must move west about 0.25° per minute without jumps');
  assert(Math.abs(current.lat - previous.lat) < 0.001, 'Declination must be continuous');
  if (Math.abs(current.lng - previous.lng) > 359) crossedAntimeridian = true;
  previous = current;
}
assert(crossedAntimeridian, 'Daily motion must cross the longitude wrap');
const first = getSubsolarPoint(start);
assert(Math.abs(angleDifference(previous.lng, first.lng)) < 0.2, 'After 24h the Sun is near the same longitude');
assert(Math.abs(previous.lat - first.lat) < 0.5, 'Season advances slowly over one day');

// Leap day and dates before the Unix epoch exercise negative Julian offsets.
for (const date of ['1900-01-01T00:00:00Z', '1969-12-31T23:59:59Z', '2000-02-29T12:00:00Z', '2100-03-01T00:00:00Z']) {
  const point = getSubsolarPoint(Date.parse(date));
  assert(Number.isFinite(point.lat) && point.lat >= -23.5 && point.lat <= 23.5);
  assert(Number.isFinite(point.lng) && point.lng >= -180 && point.lng < 180);
}
for (const value of [NaN, Infinity, -Infinity, 8.64e15 + 1, -8.64e15 - 1, undefined, null, '2026-09-23']) {
  assert.throws(() => getSubsolarPoint(value), { name: 'RangeError' }, 'Invalid dates must not produce shader NaNs');
}
console.log('Solar position validated: USNO references, seasons, Colombia day/night, time zones, daily motion, longitude wrap and invalid inputs.');
