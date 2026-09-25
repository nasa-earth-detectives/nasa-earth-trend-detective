const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { eventTarget } = require('./test-event-target.cjs');

async function main() {
  const three = await import('three');
  const root = path.resolve(__dirname, '../frontend/src/components/Globe');
  const modules = new Map();
  const solarCalls = [];
  const timers = new Map();
  let nextTimerId = 1;
  let clearedTimers = 0;
  let now = Date.parse('2026-09-22T21:06:00-05:00');
  class ClockDate extends Date { static now() { return now; } }

  const document = {
    ...eventTarget(),
    hidden: false,
    createElement() { assert.fail('Lighting must reuse the existing canvas'); },
  };
  const window = {
    ...eventTarget(),
    setInterval(callback, delay) {
      const id = nextTimerId++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearInterval(id) { assert(timers.delete(id), 'Only an active timer should be cleared'); clearedTimers++; },
    requestAnimationFrame() { assert.fail('Solar position must not be calculated per frame'); },
  };

  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const module = { exports: {} };
    modules.set(file, module);
    // Asset URLs are irrelevant to this test; retain the actual lighting config.
    const source = fs.readFileSync(file, 'utf8').replaceAll('import.meta.env.BASE_URL', "'/'");
    vm.runInNewContext(ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
      module, exports: module.exports, Date: ClockDate, document, window,
      require(name) {
        if (name === 'three') return three;
        const imported = load(path.resolve(path.dirname(file), `${name}.ts`));
        if (name !== './solarPosition') return imported;
        return { getSubsolarPoint(timestamp) { solarCalls.push(timestamp); return imported.getSubsolarPoint(timestamp); } };
      },
    }, { filename: file });
    return module.exports;
  }

  const { getSubsolarPoint } = load(path.join(root, 'solarPosition.ts'));
  const { EARTH_MATERIAL_CONFIG, EARTH_SOLAR_CONFIG } = load(path.join(root, 'earthConfig.ts'));
  const { createEarthLighting } = load(path.join(root, 'earthLighting.ts'));
  const scene = new three.Scene();
  let renderedFrames = 0;
  const beforeRender = () => renderedFrames++;
  scene.onBeforeRender = beforeRender;
  const canvas = Object.freeze({ width: 1280, height: 720 });
  const renderer = Object.freeze({ domElement: canvas });
  const lightUpdates = [];
  const coordinates = [];
  const radians = degrees => degrees * Math.PI / 180;
  const unitCoords = (lat, lng) => new three.Vector3(
    Math.cos(radians(lat)) * Math.sin(radians(lng)),
    Math.sin(radians(lat)),
    Math.cos(radians(lat)) * Math.cos(radians(lng)),
  );
  const globe = {
    scene: () => scene,
    renderer: () => renderer,
    lights(lights) { lightUpdates.push(lights); return this; },
    getCoords(lat, lng) { coordinates.push({ lat, lng }); return unitCoords(lat, lng).multiplyScalar(100); },
  };

  const lighting = createEarthLighting(globe);
  const sharedDirection = lighting.sunDirection;
  // Materials retain this reference; updates must mutate it, never replace it.
  const uniforms = [0, 1, 2, 3].map(() => ({ sunDirection: { value: sharedDirection } }));
  const lights = lightUpdates[0];
  const ambient = lights.find(light => light.name === 'earth-environment-fill');
  const sun = lights.find(light => light.name === 'earth-sun');
  assert.equal(lights.length, 2);
  assert(ambient instanceof three.AmbientLight);
  assert(sun instanceof three.DirectionalLight);
  assert.equal(ambient.intensity, EARTH_MATERIAL_CONFIG.ambientIntensity);
  assert.equal(sun.intensity, EARTH_MATERIAL_CONFIG.keyIntensity);

  function assertSynchronized(message) {
    // Astronomical correctness is independently covered by validate-solar-position.cjs.
    const point = getSubsolarPoint(now);
    const expected = unitCoords(point.lat, point.lng);
    assert.equal(solarCalls.at(-1), now, `${message}: use the current absolute UTC timestamp`);
    assert.equal(lighting.sunDirection, sharedDirection, `${message}: preserve the shared vector`);
    assert(uniforms.every(uniform => uniform.sunDirection.value === sharedDirection));
    assert(Math.abs(sharedDirection.length() - 1) < 1e-12, `${message}: direction must stay normalized`);
    assert(sharedDirection.distanceTo(expected) < 1e-12, `${message}: match the subsolar coordinates`);
    assert(sun.position.distanceTo(expected.multiplyScalar(500)) < 1e-10);
    assert(new three.Vector3().setFromMatrixPosition(sun.matrixWorld).distanceTo(sun.position) < 1e-10);
    assert.equal(coordinates.at(-1).lat, point.lat);
    assert.equal(coordinates.at(-1).lng, point.lng);
  }

  assert.equal(solarCalls.length, 1, 'Initial lighting must be ready before the first timer tick');
  assertSynchronized('Initial mount');
  const colombia = unitCoords(4.711, -74.0721);
  assert(colombia.dot(sharedDirection) < -0.6, 'Colombia at 21:06 local must face away from the Sun');
  assert.equal(timers.size, 1);
  const timer = [...timers.values()][0];
  assert.equal(EARTH_SOLAR_CONFIG.updateIntervalMs, 1000);
  assert.equal(timer.delay, 1000, 'Refresh once per second');
  assert.deepEqual([...document.listeners.keys()], ['visibilitychange']);
  assert.deepEqual([...window.listeners.keys()].sort(), ['focus', 'pageshow']);

  const beforeFrames = solarCalls.length;
  for (let frame = 0; frame < 120; frame++) scene.onBeforeRender();
  assert.equal(solarCalls.length, beforeFrames, 'Rendering frames must not calculate solar position');
  assert.equal(renderedFrames, 120);
  assert.equal(scene.onBeforeRender, beforeRender, 'Preserve the existing scene render callback');
  assert.equal(globe.renderer().domElement, canvas, 'Preserve the existing renderer and canvas');

  now += 1000;
  timer.callback();
  assertSynchronized('One-second tick');
  now = Date.parse('2026-09-23T17:00:00Z');
  timer.callback();
  assertSynchronized('Clock jumps to Colombian noon');
  assert(colombia.dot(sharedDirection) > 0.98, 'Colombia at noon must face the Sun');
  now = Date.parse('2026-09-23T02:06:00Z');
  timer.callback();
  assertSynchronized('Clock jumps backwards');
  assert(colombia.dot(sharedDirection) < -0.6, 'Correct immediately after clock moves backwards');

  const beforeHidden = solarCalls.length;
  const hiddenDirection = sharedDirection.clone();
  document.hidden = true;
  now += 7 * 86_400_000;
  for (let tick = 0; tick < 30; tick++) timer.callback();
  document.dispatch('visibilitychange');
  window.dispatch('pageshow');
  window.dispatch('focus');
  assert.equal(solarCalls.length, beforeHidden, 'Hidden tabs suspend solar calculations');
  assert(sharedDirection.equals(hiddenDirection));
  document.hidden = false;
  document.dispatch('visibilitychange');
  assert.equal(solarCalls.length, beforeHidden + 1);
  assertSynchronized('Tab resumes after a week');
  for (const event of ['pageshow', 'focus']) {
    now += 12_345;
    const beforeEvent = solarCalls.length;
    window.dispatch(event);
    assert.equal(solarCalls.length, beforeEvent + 1, `${event} must resynchronize immediately`);
    assertSynchronized(event);
  }

  let disposedLights = 0;
  for (const light of lights) {
    const dispose = light.dispose.bind(light);
    light.dispose = () => { disposedLights++; dispose(); };
  }
  const staleCallbacks = [timer.callback, ...[...document.listeners.values(), ...window.listeners.values()].flatMap(set => [...set])];
  const beforeDispose = solarCalls.length;
  const lastDirection = sharedDirection.clone();
  lighting.dispose();
  lighting.dispose();
  assert.equal(timers.size, 0);
  assert.equal(clearedTimers, 1, 'Disposal is idempotent');
  assert.equal(document.listenerCount(), 0);
  assert.equal(window.listenerCount(), 0);
  assert.equal(disposedLights, 2);
  assert.equal(lightUpdates.length, 2);
  assert.equal(lightUpdates[1].length, 0, 'Detach the lights when disposing');
  now += 86_400_000;
  document.dispatch('visibilitychange');
  window.dispatch('pageshow');
  window.dispatch('focus');
  for (const callback of staleCallbacks) callback();
  assert.equal(solarCalls.length, beforeDispose, 'Queued events must not update a disposed layer');
  assert(sharedDirection.equals(lastDirection));
  assert.equal(scene.onBeforeRender, beforeRender);
  assert.equal(globe.renderer().domElement, canvas);

  console.log('Earth lighting validated: immediate UTC sync, shared unit vector, Colombia day/night, 1s timer, clock jumps, hidden-tab suspension, resume events, existing renderer and idempotent disposal.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
