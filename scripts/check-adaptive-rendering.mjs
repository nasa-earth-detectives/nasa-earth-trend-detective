// Behaviour check for on-demand rendering of the globe (docs/obsidian/42, section 4.4): a scene at rest
// must not draw, and everything that changes the picture (hovering a column, dragging, zooming until
// tiles arrive, a switch, the trend reading, a change of profile) must still be shown.
// It counts WebGL draw calls in headless Edge/Chrome drawing by software and saves screenshots.
//
// Usage: node scripts/check-adaptive-rendering.mjs <url> <folder for screenshots>
//   e.g. node scripts/check-adaptive-rendering.mjs http://localhost:4173/ ./shots
// Needs Node 22+. BROWSER_PATH overrides the browser executable. The interface must be in English.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, folder] = process.argv.slice(2);
if (!url || !folder) { console.error('Usage: node scripts/check-adaptive-rendering.mjs <url> <folder for screenshots>'); process.exit(1); }
mkdirSync(folder, { recursive: true });
const browserPath = process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'adaptive-check-'));
const browser = spawn(browserPath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run',
  '--window-size=1366,768', '--mute-audio', '--disable-extensions',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-compositing', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function devtools(path, options) {
  for (let attempt = 0; attempt < 60; attempt++) { try { return await (await fetch(`http://127.0.0.1:${port}${path}`, options)).json(); } catch { await sleep(250); } }
  throw new Error('The browser did not open its debugging port');
}
let failures = 0;
const check = (name, ok, detail) => { if (!ok) failures++; console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}: ${detail}`); };

try {
  await devtools('/json/version');
  const tab = await devtools('/json/new?about:blank', { method: 'PUT' });
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map(); const errors = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails?.exception?.description?.slice(0, 200) ?? 'exception');
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(a => a.value ?? a.description).join(' ').slice(0, 200));
  };
  const cdp = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expression => (await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const shot = async name => { const picture = await cdp('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(folder, name), Buffer.from(picture.result.data, 'base64')); };
  const state = () => evaluate(`(c => ({ calls: window.__drawCalls, canvas: c ? c.width + 'x' + c.height : '', quality: document.documentElement.dataset.quality,
    tiles: document.querySelector('[data-earth-tiles]')?.dataset.earthTiles, readout: document.querySelector('.hex-readout__count strong')?.textContent }))(document.querySelector('canvas'))`);
  const callsDuring = async ms => { const before = (await state()).calls; await sleep(ms); return (await state()).calls - before; };
  const press = pattern => evaluate(`(() => { const b = [...document.querySelectorAll('button, [role=tab], [role=radio]')].find(x => ${pattern}.test(x.textContent) && x.textContent.length < 80); b?.click(); return !!b; })()`);
  // The switches of the View tab share one container: they are found by position inside it.
  const viewSwitch = n => evaluate(`(() => { const s = [...document.querySelectorAll('[role=switch]')].filter(e => /^Adaptive rendering/.test(e.parentElement.textContent.trim()))[${n}]; const before = s?.getAttribute('aria-checked') ?? null; s?.click(); return before; })()`);
  const wheel = async (deltaY, times) => { for (let i = 0; i < times; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 683, y: 384, deltaX: 0, deltaY }); await sleep(120); } };

  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `window.__drawCalls = 0;
    for (const Context of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!Context) continue;
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements']) {
        const original = Context.prototype[name]; if (!original) continue;
        Context.prototype[name] = function (...args) { window.__drawCalls++; return original.apply(this, args); }; } }` });
  await cdp('Page.navigate', { url });
  for (let i = 0; i < 240; i++) { await sleep(500); if (/[1-9]/.test((await state())?.readout ?? '')) break; }
  await press('/Explore without guide/');
  await sleep(9000);

  let s = await state();
  const restCanvas = s.canvas;
  const atRest = await callsDuring(2000);
  check('rest', atRest === 0 && s.quality !== 'full', `${atRest} draw calls in 2 s; canvas ${s.canvas}; profile ${s.quality}`);
  await shot('1-rest.png');

  const beforeHover = s.calls;
  for (let i = 0; i < 12; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640 + i * 6, y: 300 + i * 4, button: 'none' }); await sleep(80); }
  await sleep(600);
  const hovering = (await state()).calls - beforeHover;
  check('hover', hovering > 0 && hovering < 1000, `${hovering} draw calls while the pointer crossed the globe (a frame is about 100; dragging would be about 2,700)`);
  check('rest after hover', await callsDuring(1500) === 0 && (await state()).canvas === restCanvas, `canvas ${(await state()).canvas}`);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 60, y: 740, button: 'none' });

  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 700, y: 380, button: 'left', clickCount: 1 });
  let movingCanvas = '';
  for (let i = 0; i < 40; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700 + i * 4, y: 380, button: 'left' }); await sleep(50); if (i === 30) movingCanvas = (await state()).canvas; }
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 860, y: 380, button: 'left', clickCount: 1 });
  await sleep(3500);
  check('drag', (await state()).canvas === restCanvas, `canvas ${movingCanvas} while moving, ${(await state()).canvas} after letting go`);
  await shot('2-after-drag.png');

  await wheel(-240, 14);
  await sleep(1200);
  const arriving = await callsDuring(4000);
  check('zoom and tiles', (await state()).tiles === 'active' && arriving > 0, `tiles ${(await state()).tiles}; ${arriving} draw calls in the 4 s after stopping`);
  await sleep(2500);
  await shot('3-zoom-tiles.png');
  await wheel(240, 16);
  await sleep(3000);

  await press('/^\\s*Scene/');
  await sleep(1200);
  const beforeStars = (await state()).calls;
  const starsWere = await viewSwitch(2);
  await sleep(2500);
  check('star field switch', starsWere === 'true' && (await state()).calls > beforeStars, `was ${starsWere}; ${(await state()).calls - beforeStars} draw calls after the click`);
  await shot('4-no-stars.png');
  await viewSwitch(2);
  await sleep(2000);

  await viewSwitch(0);
  await sleep(6000);
  s = await state();
  check('switch to full', s.quality === 'full' && await callsDuring(2000) > 0 && s.readout !== '0', `profile ${s.quality}; canvas ${s.canvas}; readout ${s.readout}`);
  await viewSwitch(0);
  await sleep(7000);
  s = await state();
  check('back to on-demand', s.quality !== 'full' && await callsDuring(2000) === 0 && s.readout !== '0', `profile ${s.quality}; canvas ${s.canvas}; readout ${s.readout}`);
  await shot('5-back-on-demand.png');

  await press('/^Data$/');
  await sleep(600);
  const beforeTrend = (await state()).calls;
  await press('/Trend \\(Sen\\)/');
  await sleep(5000);
  check('trend reading', (await state()).calls > beforeTrend && await callsDuring(2000) === 0, `${(await state()).calls - beforeTrend} draw calls after the change, then at rest`);
  await shot('6-trend.png');

  check('console', errors.length === 0, errors.length ? errors.slice(0, 4).join(' | ') : 'no errors');
  console.log(failures ? `RESULT: ${failures} check(s) failed` : 'RESULT: all checks passed');
  socket.close();
  process.exitCode = failures ? 1 : 0;
} finally {
  browser.kill();
  await sleep(600);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold the folder */ }
}
