// Measures how the page behaves on a weak laptop: headless Edge/Chrome drawing WebGL by software (no
// graphics card), a 1366x768 screen and a throttled CPU. See docs/obsidian/42 (section 4.4).
//
// Two figures per stage, because they are not the same thing:
//  - "main thread": how many times per second the browser gets to serve the page (requestAnimationFrame).
//    That is what a visitor feels when clicking: at 5 per second the page "freezes".
//  - "drawn": in how many of those frames the globe issued WebGL draw calls. A scene at rest gives a high
//    main-thread figure and 0 drawn; without the second figure, resting would look like a miracle.
// The draw calls per frame also give away an incomplete scene: a globe that lost its data draws faster.
//
// The guide opens with a veil over the globe, so it is closed before dragging: with it open the drag
// never reaches the canvas and nothing rotates.
//
// Usage: node scripts/benchmark-weak-laptop.mjs <url> [label] [software|gpu] [cpu-throttle] [shot.png] [fake-gpu-name]
//   fake-gpu-name: announce that renderer (plus 8 GB and 8 cores) to the page while still drawing by
//   software, i.e. a machine the detection gets wrong. Exercises the automatic switch to adaptive rendering.
// Needs Node 22+ (global WebSocket). BROWSER_PATH overrides the browser executable; SETTLE_MS (default
// 8000) is the wait before measuring; SHOT_SCALE=2 saves the screenshot at twice the size.
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, label = 'run', mode = 'software', throttle = '4', shot = '', fakeGpu = ''] = process.argv.slice(2);
if (!url) { console.error('Usage: node scripts/benchmark-weak-laptop.mjs <url> [label] [software|gpu] [cpu-throttle] [shot.png] [fake-gpu-name]'); process.exit(1); }
const browserPath = process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const settleMs = Number(process.env.SETTLE_MS ?? 8000);
const port = 9400 + Math.floor(Math.random() * 400);
const profile = mkdtempSync(join(tmpdir(), 'weak-laptop-'));
const graphics = mode === 'software'
  ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-compositing']
  : ['--use-angle=d3d11', '--ignore-gpu-blocklist'];
const browser = spawn(browserPath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--window-size=1366,768', '--mute-audio', '--disable-extensions', ...graphics, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function devtools(path, options) {
  for (let attempt = 0; attempt < 60; attempt++) {
    try { return await (await fetch(`http://127.0.0.1:${port}${path}`, options)).json(); } catch { await sleep(250); }
  }
  throw new Error('The browser did not open its debugging port');
}

try {
  await devtools('/json/version');
  const tab = await devtools('/json/new?about:blank', { method: 'PUT' });
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0; const pending = new Map(); const listeners = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); } else listeners.forEach(listen => listen(message));
  };
  const cdp = (method, params = {}) => new Promise(resolve => { const n = ++id; pending.set(n, resolve); socket.send(JSON.stringify({ id: n, method, params })); });
  const evaluate = async expression => {
    const reply = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (reply.result?.exceptionDetails) throw new Error(JSON.stringify(reply.result.exceptionDetails).slice(0, 400));
    return reply.result?.result?.value;
  };
  const canvasSize = () => evaluate(`(c => c ? c.width + 'x' + c.height : 'no canvas')(document.querySelector('canvas'))`);

  let bytes = 0, requests = 0; const byType = {}; const types = new Map(); let loadedAt = null;
  listeners.push(message => {
    if (message.method === 'Network.responseReceived') types.set(message.params.requestId, message.params.type);
    if (message.method === 'Network.loadingFinished') {
      bytes += message.params.encodedDataLength; requests++;
      const type = types.get(message.params.requestId) ?? 'Other'; byType[type] = (byType[type] ?? 0) + message.params.encodedDataLength;
    }
    if (message.method === 'Page.loadEventFired') loadedAt = Date.now();
  });
  await cdp('Network.enable'); await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setCPUThrottlingRate', { rate: Number(throttle) });
  await cdp('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__longTasks = []; try { new PerformanceObserver(list => list.getEntries().forEach(entry => window.__longTasks.push(Math.round(entry.duration)))).observe({ entryTypes: ['longtask'] }); } catch {}
    if (${JSON.stringify(fakeGpu)}) {
      for (const Context of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
        if (!Context) continue; const read = Context.prototype.getParameter;
        Context.prototype.getParameter = function (name) { return name === 0x9246 || name === 0x1F01 ? ${JSON.stringify(fakeGpu)} : read.call(this, name); };
      }
      try { Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 }); Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }); } catch {}
    }
    // Draw-call counter: tells a painted frame from one in which the scene was at rest.
    window.__drawCalls = 0;
    for (const Context of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) {
      if (!Context) continue;
      for (const name of ['drawElements', 'drawArrays', 'drawElementsInstanced', 'drawArraysInstanced', 'drawRangeElements']) {
        const original = Context.prototype[name]; if (!original) continue;
        Context.prototype[name] = function (...args) { window.__drawCalls++; return original.apply(this, args); };
      }
    }
  ` });
  const startedAt = Date.now();
  await cdp('Page.navigate', { url });

  // Time until the globe readout shows a sample count above zero (real data on screen).
  let dataAt = null, readout = '';
  for (let attempt = 0; attempt < 180 && dataAt === null; attempt++) {
    await sleep(500);
    readout = await evaluate(`document.querySelector('.hex-readout__count strong')?.textContent ?? ''`).catch(() => '');
    if (/[1-9]/.test(readout ?? '')) dataAt = Date.now();
  }
  const qualityAtData = await evaluate(`document.documentElement.dataset.quality || null`).catch(() => null);
  const guideClosed = await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find(b => /Explore without guide|Explorar sin gu/.test(b.textContent)); button?.click(); return !!button; })()`).catch(() => false);
  await sleep(settleMs); // textures, models and layers settle, and the frame watcher makes up its mind

  const measureFrames = ms => evaluate(`new Promise(resolve => {
    const gaps = []; let last = performance.now(); const end = last + ${ms};
    let seen = window.__drawCalls, drawn = 0, canvas = ''; const callsAtStart = seen;
    const step = now => { gaps.push(now - last); last = now;
      if (window.__drawCalls !== seen) { drawn++; seen = window.__drawCalls; }
      if (!canvas && now > end - ${ms} * 0.4) { const c = document.querySelector('canvas'); canvas = c ? c.width + 'x' + c.height : '?'; }
      if (now < end) { requestAnimationFrame(step); return; }
      gaps.sort((a, b) => a - b); const total = gaps.reduce((a, b) => a + b, 0);
      resolve({ canvas, fps: +(1000 * gaps.length / total).toFixed(1), drawn: +(1000 * drawn / total).toFixed(1),
        callsPerFrame: drawn ? Math.round((window.__drawCalls - callsAtStart) / drawn) : 0,
        p50: +gaps[Math.floor(gaps.length * .5)].toFixed(0), p95: +gaps[Math.floor(gaps.length * .95)].toFixed(0), worst: +gaps[gaps.length - 1].toFixed(0) }); };
    requestAnimationFrame(step);
  })`);
  const idle = await measureFrames(6000);
  const beforeDrag = await evaluate(`(tasks => ({ count: tasks.length, ms: tasks.reduce((a, b) => a + b, 0) }))(window.__longTasks || [])`);

  // Drag the globe while measuring.
  const drag = (async () => {
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 900, y: 380, button: 'left', clickCount: 1 });
    for (let i = 0; i < 80; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900 + i * 3, y: 380 + Math.round(20 * Math.sin(i / 8)), button: 'left' }); await sleep(60); }
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1140, y: 380, button: 'left', clickCount: 1 });
  })();
  const dragging = await measureFrames(5000);
  await drag;
  // After letting go: how long until the canvas reaches its final resolution, and which one it is.
  const releasedAt = Date.now(); let finalCanvas = '', lastChange = 0;
  for (let i = 0; i < 40; i++) { await sleep(100); const size = await canvasSize(); if (size !== finalCanvas) { finalCanvas = size; lastChange = Date.now() - releasedAt; } }

  const info = await evaluate(`(() => {
    let gpu = '?';
    try { const gl = document.createElement('canvas').getContext('webgl2'); const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL); } catch {}
    const tasks = window.__longTasks || [];
    return { gpu, longTasks: tasks.length, longTaskMs: tasks.reduce((a, b) => a + b, 0), worstTask: Math.max(0, ...tasks),
      heapMb: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null, quality: document.documentElement.dataset.quality || null,
      notice: document.querySelector('.data-connection')?.textContent || null };
  })()`);
  if (shot) {
    const scale = Number(process.env.SHOT_SCALE ?? 1);
    const picture = await cdp('Page.captureScreenshot', scale > 1 ? { format: 'png', clip: { x: 0, y: 0, width: 1366, height: 768, scale } } : { format: 'png' });
    if (picture.result?.data) writeFileSync(shot, Buffer.from(picture.result.data, 'base64'));
  }
  const mb = n => (n / 1048576).toFixed(2);
  const stage = r => `main thread ${r.fps}/s (median ${r.p50} ms, p95 ${r.p95} ms, worst ${r.worst} ms) | drawn ${r.drawn}/s, ${r.callsPerFrame} draw calls per frame | canvas ${r.canvas}`;
  console.log(`== ${label} | ${url}`);
  console.log(`   graphics: ${fakeGpu ? `software, announced to the page as "${fakeGpu}"` : info.gpu} | CPU throttled x${throttle} | quality: ${qualityAtData ?? 'no profiles'} when data arrived, ${info.quality ?? 'no profiles'} at the end`);
  console.log(`   guide closed before measuring: ${guideClosed ? 'yes' : 'NO (the drag may not reach the globe)'}`);
  console.log(`   page load: ${loadedAt ? ((loadedAt - startedAt) / 1000).toFixed(1) : '?'} s | data on screen: ${dataAt ? ((dataAt - startedAt) / 1000).toFixed(1) + ' s' : 'did NOT arrive in 90 s'} (readout: "${readout}")`);
  console.log(`   idle:     ${stage(idle)}`);
  console.log(`   dragging: ${stage(dragging)}`);
  console.log(`   after letting go: final canvas ${finalCanvas}, last change of resolution at ${lastChange} ms`);
  console.log(`   long tasks (>50 ms) before dragging (load and idle): ${beforeDrag.count}, ${(beforeDrag.ms / 1000).toFixed(1)} s`);
  console.log(`   long tasks (>50 ms) in the whole run: ${info.longTasks}, ${(info.longTaskMs / 1000).toFixed(1)} s, worst ${info.worstTask} ms | JS heap ${info.heapMb} MB`);
  console.log(`   downloaded: ${mb(bytes)} MB in ${requests} requests | ` + Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, size]) => `${type} ${mb(size)}`).join(', '));
  if (info.notice) console.log(`   notice on screen: ${info.notice}`);
  socket.close();
} finally {
  browser.kill();
  await sleep(600);
  try { rmSync(profile, { recursive: true, force: true }); } catch { /* the browser may still hold the folder */ }
}
