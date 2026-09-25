const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const ts = require('typescript');
const { validatePickingRays, validateGlobalPicking, validateDistanceBrightness } = require('./hex-picking-cases.cjs');

// Sin navegador ni WebGL: contrasta la selección con la geometría real de Three.
// Ejecutar: node scripts/validate-hex-picking.cjs
async function main() {
  const three = await import('three');
  const root = path.resolve(__dirname, '../frontend/src');
  const modules = new Map();
  let reducedMotion = true;
  function load(file) {
    if (modules.has(file)) return modules.get(file).exports;
    const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    modules.set(file, module);
    vm.runInNewContext(compiled, {
      module, exports: module.exports, performance,
      window: { matchMedia: () => ({ get matches() { return reducedMotion; } }) },
      require: name => name === 'three' ? three : load(path.resolve(path.dirname(file), name + '.ts')),
    }, { filename: file });
    return module.exports;
  }
  const { createHexColumns, HEX_COLUMN_CONFIG } = load(path.join(root, 'components/Globe/hexColumns.ts'));
  const { HEX_GLOBAL_COVERAGE } = load(path.join(root, 'services/demo/hexGlobalCoverage.ts'));
  const { HEX_DEMO_COVERAGE } = load(path.join(root, 'services/demo/hexDemoCoverage.ts'));
  for (const coverage of [HEX_GLOBAL_COVERAGE, HEX_DEMO_COVERAGE]) {
    assert(HEX_COLUMN_CONFIG.footprintRatio <= coverage.footprintRadiusFactor,
      'Coastal coverage guard must cover the actual renderer footprint');
  }
  const { createDemoHexDataset } = load(path.join(root, 'services/demo/hexDemoData.ts'));
  const filter = { variable: 'Gistemp', startYear: 2002, endYear: 2024 };
  const dataset = createDemoHexDataset(filter, 'stress');
  const radius = 100;
  const scene = new three.Scene();
  const camera = new three.PerspectiveCamera(50, 1920 / 1080, 1, 10000);
  camera.position.set(-67, 99, 305);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);
  const canvas = { style: { cursor: '' }, addEventListener() {}, removeEventListener() {} };
  const selections = [];
  const selectedCells = [];
  let coordinateCalls = 0;
  const globe = {
    getGlobeRadius: () => radius,
    customThreeObject(factory) { scene.add(factory()); return this; },
    customThreeObjectUpdate() { return this; },
    customLayerData() { return this; },
    renderer: () => ({ domElement: canvas }),
    scene: () => scene,
    getCoords(lat, lng) {
      coordinateCalls++;
      const phi = lat * Math.PI / 180;
      const theta = lng * Math.PI / 180;
      return { x: radius * Math.cos(phi) * Math.sin(theta), y: radius * Math.sin(phi), z: radius * Math.cos(phi) * Math.cos(theta) };
    },
  };
  const columns = createHexColumns(globe, cell => {
    selections.push(cell?.id ?? null);
    selectedCells.push(cell);
  });
  const began = performance.now();
  columns.setDataset(dataset);
  const initialSetupMs = performance.now() - began;
  const mesh = scene.getObjectByName('earth-analysis-hex-columns');
  assert.equal(mesh.count, 6211);
  assert.equal(coordinateCalls, 6211);
  const array = mesh.instanceMatrix.array;
  const oldHeight = Math.hypot(array[4], array[5], array[6]);
  const palette = mesh.instanceColor.array.slice();
  const changed = createDemoHexDataset({ ...filter, endYear: 2026 }, 'stress');
  reducedMotion = false;
  columns.select(dataset.cells[10].id);
  assert.equal(selectedCells.at(-1), dataset.cells[10]);
  columns.setDataset(null);
  assert.equal(mesh.visible, false);
  assert.equal(selections.at(-1), null);
  assert.equal(selectedCells.at(-1), null, 'Durante la consulta no se conserva la lectura del año anterior.');
  const beganUpdate = performance.now();
  columns.setDataset(changed);
  const cachedUpdateMs = performance.now() - beganUpdate;
  assert.equal(mesh, scene.getObjectByName('earth-analysis-hex-columns'));
  assert.equal(mesh.instanceMatrix.array, array);
  assert.equal(coordinateCalls, 6211, 'Cambiar año tras null no vuelve a calcular coordenadas/BVH.');
  assert.equal(selectedCells.at(-1), changed.cells[10], 'La selección se restaura por ID con la celda del nuevo año.');
  assert.notEqual(selectedCells.at(-1).slope, dataset.cells[10].slope, 'La lectura seleccionada actualiza su magnitud.');
  assert.equal(Math.hypot(array[4], array[5], array[6]), oldHeight, 'La transición arranca de la altura previa, no de cero.');
  assert.notDeepEqual(mesh.instanceColor.array, palette, 'La paleta responde a los nuevos valores.');
  reducedMotion = true;
  scene.updateMatrixWorld(true);
  scene.onBeforeRender({}, scene, camera, null, null, null);
  assert(Math.abs(Math.hypot(array[4], array[5], array[6]) - Math.max(0.001,
    Math.abs(changed.cells[0].slope) / changed.heightDomain * radius * HEX_COLUMN_CONFIG.maxHeightRatio)) < 1e-5);
  assert(Math.abs(Math.hypot(array[0], array[1], array[2])
    - radius * Math.PI / 180 * changed.resolutionDegrees * HEX_COLUMN_CONFIG.footprintRatio) < 1e-5);
  mesh.instanceColor.clearUpdateRanges();
  columns.select(changed.cells[10].id);
  assert.deepEqual(Array.from(mesh.instanceColor.updateRanges, r => ({ ...r })), [{ start: 30, count: 3 }]);
  columns.select(changed.cells[20].id);
  assert(mesh.instanceColor.updateRanges.every(range => range.count === 3), 'Seleccionar no sube todos los colores.');

  const picking = validatePickingRays({ three, mesh, radius, scene, camera });
  const { nearest, measurements, comparisons, positiveHits } = picking;
  const selectedId = changed.cells[20].id;
  columns.select(selectedId);
  columns.setDataset(null);
  columns.setDataset({ ...changed, cells: changed.cells.filter(cell => cell.id !== selectedId) });
  assert.equal(selections.at(-1), null, 'La siguiente cobertura ya no contiene la celda seleccionada.');
  assert.equal(scene.getObjectByName('earth-analysis-hex-columns'), mesh, 'Una cobertura menor reutiliza la capacidad del mismo InstancedMesh.');
  columns.setDataset(changed);
  assert.equal(selections.at(-1), null, 'Una selección invalidada no reaparece al recuperar cobertura.');
  columns.select(selectedId);
  columns.setDataset(null);
  columns.select(null);
  columns.setDataset(changed);
  assert.equal(selections.at(-1), null, 'La deselección explícita durante la espera cancela la intención.');
  columns.select(selectedId);
  columns.setDataset(null);
  assert.equal(columns.pick(0, 0), false);
  columns.setDataset(changed);
  assert.equal(selections.at(-1), null, 'Un clic sin impacto cancela la intención.');
  columns.select(selectedId);
  columns.setDataset(null);
  columns.setVisible(false);
  columns.setDataset(changed);
  columns.setVisible(true);
  assert.equal(selections.at(-1), null, 'Ocultar la capa cancela la selección incluso durante la espera.');
  columns.select(selectedId);
  columns.setDataset({ ...changed, cells: [] });
  columns.setDataset(changed);
  assert.equal(selections.at(-1), null, 'Una respuesta válida vacía invalida la selección.');
  assert.equal(scene.getObjectByName('earth-analysis-hex-columns'), mesh);
  columns.setVisible(false);
  assert.equal(nearest(false), undefined);
  // Perfil global real: polos, antimeridiano y hemisferios distribuidos en 8.192 centros.
  columns.setVisible(true);
  const globalData = createDemoHexDataset(filter, 'global');
  assert.equal(globalData.cells.length, 8192);
  columns.setDataset(globalData);
  const globalMesh = scene.getObjectByName('earth-analysis-hex-columns');
  assert.equal(globalMesh.count, 8192);
  assert.equal(globalMesh.material.transparent, false, 'El detalle por distancia mantiene oclusión opaca estable.');
  assert.equal(globalMesh.material.depthWrite, true);
  assert.equal(globalMesh.material.opacity, 1);
  const globalComparisons = validateGlobalPicking({ three, globalMesh, scene, camera, picking });
  const distanceBrightness = validateDistanceBrightness({
    three, globalMesh, radius, scene, camera, selections, HEX_COLUMN_CONFIG,
  });
  const globalChanged = createDemoHexDataset({ ...filter, endYear: 2026 }, 'global');
  columns.select(globalData.cells[4000].id);
  columns.setDataset(null);
  columns.setDataset(globalChanged);
  assert.equal(selectedCells.at(-1), globalChanged.cells[4000]);
  assert.equal(scene.getObjectByName('earth-analysis-hex-columns'), globalMesh);
  let materialDisposed = false;
  let geometryDisposed = false;
  globalMesh.material.addEventListener('dispose', () => { materialDisposed = true; });
  globalMesh.geometry.addEventListener('dispose', () => { geometryDisposed = true; });
  columns.dispose();
  assert.equal(scene.getObjectByName('earth-analysis-hex-columns'), undefined);
  assert(materialDisposed && geometryDisposed);
  console.log(JSON.stringify({ result: 'PASS', cells: 6211, globalCells: 8192, comparisons, globalComparisons, positiveHits, rejectedBackside: picking.rejectedBackside,
    distanceBrightness,
    initialSetupMs, cachedUpdateMs, measurements,
    checks: ['native raycast equivalence', 'earth occlusion', 'screen gaps and limb', 'near camera', 'intro scale/rotation/offset',
      'null during fetch preserves matrices and heights', 'same geography cached', 'partial color uploads', 'one mesh',
      'selected cell restored with current slope', 'missing cell clears selection', 'explicit deselection cancels restoration',
      'empty pick cancels restoration', 'hidden layer cancels restoration', 'empty response clears selection',
      'global raycast equivalence', 'renderer footprint guard', 'distance brightness without data/matrix/color changes', 'no per-frame state',
      'global same mesh and selection across years', 'hidden layer', 'disposal'] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
