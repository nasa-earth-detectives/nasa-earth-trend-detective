/** Ejecutar con playwright-cli run-code. Instrumentación temporal, sin cambiar producción. */
async (page) => {
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  await page.route('**/src/components/Globe/useGlobeScene.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    if (!body.includes('globe.backgroundColor(')) throw new Error('No se encontró Globe');
    await route.fulfill({ response, body: body.replace('globe.backgroundColor(', 'window.__hexBenchmarkGlobe = globe; globe.backgroundColor(') });
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.reload();
  await page.waitForFunction(() => window.__hexBenchmarkGlobe?.scene().getObjectByName('earth-analysis-hex-columns')?.count === 8192);
  await page.waitForFunction(() => document.querySelector('[data-earth-surface]')?.dataset.earthSurface === 'ready');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__hexBenchmarkCanvas = document.querySelector('canvas'); });
  const results = [];
  for (const mode of ['idle', 'hover', 'orbit', 'zoom', 'variable', 'timeline']) {
    await page.getByRole('button', { name: 'Recentrar la Tierra' }).click();
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const renderer = window.__hexBenchmarkGlobe.renderer();
      window.__hexBenchmark = { start: performance.now(), last: performance.now(), frame: renderer.info.render.frame, intervals: [], done: false };
      const tick = now => {
        const sample = window.__hexBenchmark;
        if (renderer.info.render.frame !== sample.frame) {
          sample.intervals.push(now - sample.last);
          sample.last = now; sample.frame = renderer.info.render.frame;
        }
        if (now - sample.start >= 6000) { sample.done = true; return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (mode === 'hover' || mode === 'orbit') {
      await page.mouse.move(940, 510);
      if (mode === 'orbit') await page.mouse.down();
      for (let i = 0; i < 6; i++) await page.mouse.move(i % 2 ? 995 : 940, i % 2 ? 535 : 510, { steps: 30 });
      if (mode === 'orbit') await page.mouse.up();
    } else if (mode === 'zoom') {
      await page.mouse.move(950, 510);
      for (let i = 0; i < 4; i++) { await page.mouse.wheel(0, i % 2 ? 110 : -110); await page.waitForTimeout(550); }
    } else if (mode === 'variable') {
      await page.getByRole('button', { name: 'Variables', exact: true }).click();
      for (const name of ['Vegetación', 'Masa de agua', 'Dióxido', 'Temperatura']) {
        await page.getByRole('radio', { name: new RegExp(name) }).click();
        await page.waitForTimeout(500);
      }
      await page.keyboard.press('Escape');
    } else if (mode === 'timeline') {
      await page.getByRole('button', { name: 'Tiempo', exact: true }).click();
      for (const year of ['2010', '2020', '2015', '2024']) {
        await page.getByRole('slider', { name: 'Año de consulta' }).fill(year);
        await page.waitForTimeout(500);
      }
      await page.keyboard.press('Escape');
    }
    await page.waitForFunction(() => window.__hexBenchmark.done);
    results.push(await page.evaluate(mode => {
      const sample = window.__hexBenchmark;
      let sum = 0, count = 0, worstSecond = Infinity;
      for (const ms of sample.intervals) {
        sum += ms; count++;
        if (sum >= 1000) { worstSecond = Math.min(worstSecond, count * 1000 / sum); sum = 0; count = 0; }
      }
      return { mode, averageFps: sample.intervals.length * 1000 / (sample.last - sample.start), worstOneSecondFps: worstSecond, worstFrameMs: Math.max(...sample.intervals) };
    }, mode));
  }
  const scene = await page.evaluate(() => {
    const g = window.__hexBenchmarkGlobe, renderer = g.renderer(), gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), pixelRatio: renderer.getPixelRatio(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, memory: renderer.info.memory, totalCells: g.scene().getObjectByName('earth-analysis-hex-columns').count, sameCanvas: window.__hexBenchmarkCanvas === document.querySelector('canvas'), canvasCount: document.querySelectorAll('canvas').length };
  });
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  return { fixture: 'global', cells: 8192, note: 'Las 8192 celdas están distribuidas sobre toda la esfera; no son 8192 celdas simultáneamente visibles.', viewport: page.viewportSize(), secondsPerMode: 6, results, scene };
}
