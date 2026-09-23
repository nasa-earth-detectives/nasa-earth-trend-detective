const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..', 'frontend/src');
const modules = new Map();

async function main() {
const three = await import('three');
const { Color } = three;
function load(file) {
  const absolute = path.resolve(file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  modules.set(absolute, module);
  const importModule = (name) => {
    if (name === 'three') return three;
    if (!name.startsWith('.')) return require(name);
    const base = path.resolve(path.dirname(absolute), name);
    return load(fs.existsSync(base + '.ts') ? base + '.ts' : base + '.tsx');
  };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: importModule, Number, Math, RangeError }, { filename: absolute });
  return module.exports;
}

const { sampleHexColor, HEX_PALETTE, HEX_PALETTE_GRADIENT } = load(path.join(root, 'config/hexPalette.ts'));
const color = new Color();
const hex = (value, domain = 1) => sampleHexColor(value, domain, color).getHexString();
assert.equal(sampleHexColor(0, 1, color), color, 'Reutiliza el destino en vez de asignar un objeto por celda.');
assert.equal(hex(-1), HEX_PALETTE.negative.slice(1));
assert.equal(hex(0), HEX_PALETTE.neutral.slice(1));
assert.equal(hex(-0), HEX_PALETTE.neutral.slice(1));
assert.equal(hex(1), HEX_PALETTE.positive.slice(1));
assert.equal(hex(-10), HEX_PALETTE.negative.slice(1));
assert.equal(hex(10), HEX_PALETTE.positive.slice(1));
assert.equal(hex(0.5, 1), hex(5, 10), 'El color depende de la escala declarada, no del conjunto recibido.');
assert.notEqual(hex(0.25), hex(0.5));
assert.notEqual(hex(-0.25), hex(0.25));
// Un punto medio CSS sRGB debe coincidir con su salida de Three tras convertirla otra vez a sRGB.
const byte = (value, index) => parseInt(value.slice(1 + index * 2, 3 + index * 2), 16);
const middle = new Color().setHex(parseInt(hex(-0.5), 16)).convertLinearToSRGB();
for (const [index, channel] of ['r', 'g', 'b'].entries()) {
  const expected = (byte(HEX_PALETTE.negative, index) + byte(HEX_PALETTE.neutral, index)) / 2;
  assert(Math.abs(middle[channel] * 255 - expected) <= 0.51, 'La leyenda y los colores de instancia usan la misma interpolación.');
}
const first = hex(-0.23);
for (let i = -200; i <= 200; i++) {
  sampleHexColor(i / 100, 1, color);
  assert([color.r, color.g, color.b].every(channel => Number.isFinite(channel) && channel >= 0 && channel <= 1));
}
assert.equal(hex(-0.23), first, 'Las referencias de paleta permanecen inmutables.');
for (const pair of [[NaN, 1], [Infinity, 1], [-Infinity, 1], [1, 0], [1, -1], [1, NaN], [1, Infinity]]) {
  assert.throws(() => sampleHexColor(...pair, color), RangeError);
}
assert(HEX_PALETTE_GRADIENT.includes(HEX_PALETTE.negative));
assert(HEX_PALETTE_GRADIENT.includes(HEX_PALETTE.positive));

const { HexReadout } = load(path.join(root, 'components/Mission/HexReadout.tsx'));
const { describeHexTrend, formatHexValue, readableHexUnit } = load(path.join(root, 'config/hexPresentation.ts'));
const cell = { id: 'test', latitude: 4.7, longitude: -74, slope: 2 };
const dataset = { variable: 'Gistemp', cells: [cell], heightDomain: 1, unit: '°C / año', source: 'demo', startYear: 2002, endYear: 2024, resolutionDegrees: 1 };
const render = (props = {}) => renderToStaticMarkup(React.createElement(HexReadout, {
  data: dataset, loading: false, error: null, selectedCell: cell, onSelectCell() {}, ...props,
}));
const clipped = render();
assert(clipped.includes('Fuera de escala'));
assert(clipped.includes('Datos simulados'));
assert(clipped.includes('Incremento'));
assert(clipped.includes('El color no indica significancia estadística'));
assert(clipped.includes('°C / año'));
assert(clipped.includes('°C por año'));
assert(clipped.includes('Tendencia de temperatura'));
assert(clipped.includes('Aumento de temperatura'));
assert(clipped.includes('no es la temperatura actual'));
assert(clipped.includes('La anomalía de temperatura aumenta 2 °C por año entre 2002 y 2024'));
assert(clipped.includes('Ritmo de cambio'));
assert(render({ selectedCell: null }).includes('celdas de muestra'));
assert(!render({ selectedCell: { ...cell, slope: 0 } }).includes('Fuera de escala'));
assert(render({ selectedCell: { ...cell, slope: -0.4 } }).includes('Descenso'));
assert(!render({ loading: true }).includes('hex-color-key'));
assert(!render({ error: 'Prueba de error' }).includes('hex-color-key'));
assert(!render({ data: { ...dataset, cells: [] }, selectedCell: null }).includes('hex-color-key'));
assert(render({ data: { ...dataset, source: 'api', unit: 'pendiente · unidad no declarada' } }).includes('unidad no declarada'));
// Regresión NDVI: pendientes pequeñas conservan signo y no contradicen «Sin cambio».
const measurement = slope => render({ selectedCell: { ...cell, slope } })
  .match(/hex-readout__measurement"[^>]*>[\s\S]*?<strong[^>]*>([^<]+)<\/strong>/)?.[1];
assert.equal(measurement(-0.0000232), '-2,32E-5');
assert.equal(measurement(0.0000082), '+8,2E-6');
assert.equal(measurement(0), '0');
assert.equal(measurement(-0), '0');
assert.equal(measurement(0.0001), '+0,0001');
assert.equal(measurement(-0.08), '-0,08');
assert.equal(measurement(0.0705123), '+0,0705');
assert(render({ selectedCell: { ...cell, slope: 0.0705123 } }).includes('Valor recibido: 0.0705123 °C / año'));
const tinyDomain = render({ data: { ...dataset, heightDomain: 0.0000082 } });
assert(tinyDomain.includes('<span>-8,2E-6</span><span>0</span><span>+8,2E-6</span>'));
assert(tinyDomain.includes('limitados a ±8,2E-6'));
assert(tinyDomain.includes('Escala fija de cero a 8,2E-6'));
assert.equal(readableHexUnit('°C / década'), '°C por década');
assert.equal(readableHexUnit('ppm'), 'ppm');
assert.equal(readableHexUnit('pendiente · unidad no declarada'), 'unidad no declarada');
assert(!describeHexTrend('Gistemp', 0.2, 'pendiente · unidad no declarada', 2000, 2024).includes('por año'));
assert(describeHexTrend('Gistemp', 0, 'pendiente · unidad no declarada', 2000, 2024).includes('no declara la unidad ni la base temporal'));
assert(describeHexTrend('ModisNdvi', -0.0000232, 'NDVI / año', 2000, 2024).includes('El índice NDVI disminuye 2,32E-5 NDVI por año'));
assert(!describeHexTrend('ModisNdvi', -0.001, 'NDVI / año', 2000, 2024).includes('hay deforestación'));
assert(describeHexTrend('GraceMass', -0.2, 'cm H₂O eq. / década', 2000, 2024).includes('disminuye 0,2 cm H₂O eq. por década'));
assert(describeHexTrend('Oco2', 0, 'ppm / año', 2000, 2024).includes('pendiente cero'));
assert(!describeHexTrend('Oco2', 0, 'ppm / año', 2000, 2024).includes('cambio neto'));
assert.equal(formatHexValue(-0.000000008231, true), '-8,23E-9');
for (const [variable, heading, direction] of [
  ['ModisNdvi', 'Tendencia de vegetación', 'Descenso de NDVI'],
  ['GraceMass', 'Tendencia de agua y hielo', 'Descenso de masa de agua y hielo'],
  ['Oco2', 'Tendencia de CO₂', 'Descenso de CO₂'],
]) {
  const markup = render({ data: { ...dataset, variable }, selectedCell: { ...cell, slope: -0.001 } });
  assert(markup.includes(heading));
  assert(markup.includes(direction));
}
console.log(JSON.stringify({ result: 'PASS', checks: ['signed endpoints', 'neutral zero', 'clamp', 'fixed domain', 'CSS/linear RGB match', 'reused output', 'immutable references', 'invalid input rejection', 'clipping notice', 'simulated source label', 'sign text', 'unknown API unit preserved', 'loading/error/empty legend', 'small signed values never become zero', 'exact zero preserved', 'small domains stay readable', 'context by variable', 'full accessible rate sentence', 'precise value available', 'three significant digits', 'metadata-only temporal unit', 'no unsupported scientific interpretation'] }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
