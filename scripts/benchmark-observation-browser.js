/** Ejecutar con playwright-cli run-code. Sólo instrumenta la respuesta de Vite del navegador de prueba. */
async (page) => {
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  await page.route('**/src/components/Globe/useGlobeScene.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    if (!body.includes('globe.backgroundColor(')) throw new Error('No se encontró Globe');
    await route.fulfill({ response, body: body.replace('globe.backgroundColor(', 'window.__observationGlobe = globe; globe.backgroundColor(') });
  });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.reload();
  await page.waitForFunction(() => window.__observationGlobe?.scene().getObjectByName('earth-analysis-hex-columns')?.count > 0);
  await page.waitForFunction(() => document.querySelector('[data-earth-surface]')?.dataset.earthSurface === 'ready');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__observationCanvas = document.querySelector('canvas'); });
  const results = [];
  for (const layer of ['Hexágonos 3D', 'Mapa de calor']) {
    await page.getByRole('button', { name: 'Variables', exact: true }).click();
    await page.getByRole('radio', { name: layer, exact: true }).click();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    for (const mode of ['idle', 'orbit', 'zoom', 'variable', 'timeline']) {
      await page.getByRole('button', { name: 'Recentrar la Tierra' }).click();
      await page.waitForTimeout(800);
      await page.evaluate(() => {
        const renderer = window.__observationGlobe.renderer();
        window.__observationBenchmark = { start: performance.now(), last: performance.now(), frame: renderer.info.render.frame, intervals: [], done: false };
        const tick = now => {
          const sample = window.__observationBenchmark;
          if (renderer.info.render.frame !== sample.frame) {
            sample.intervals.push(now - sample.last);
            sample.last = now; sample.frame = renderer.info.render.frame;
          }
          if (now - sample.start >= 6000) { sample.done = true; return; }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      if (mode === 'orbit') {
        await page.mouse.move(940, 510);
        await page.mouse.down();
        for (let i = 0; i < 8; i++) await page.mouse.move(i % 2 ? 1020 : 940, i % 2 ? 540 : 510, { steps: 24 });
        await page.mouse.up();
      } else if (mode === 'zoom') {
        await page.mouse.move(950, 510);
        for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, i % 2 ? 110 : -110); await page.waitForTimeout(500); }
      } else if (mode === 'variable') {
        await page.getByRole('button', { name: 'Variables', exact: true }).click();
        for (const name of ['Vegetación', 'Masa de agua', 'Dióxido', 'Temperatura']) {
          await page.getByRole('radio', { name: new RegExp(name) }).click();
          await page.waitForTimeout(700);
        }
        await page.keyboard.press('Escape');
      } else if (mode === 'timeline') {
        await page.getByRole('button', { name: 'Tiempo', exact: true }).click();
        for (const year of ['2010', '2020', '2015', '2024']) {
          await page.getByRole('slider', { name: 'Año de consulta', exact: true }).fill(year);
          await page.waitForTimeout(700);
        }
        await page.keyboard.press('Escape');
      }
      await page.waitForFunction(() => window.__observationBenchmark.done);
      results.push(await page.evaluate(({ layer, mode }) => {
        const sample = window.__observationBenchmark;
        let sum = 0, count = 0, worstSecond = Infinity;
        for (const ms of sample.intervals) {
          sum += ms; count++;
          if (sum >= 1000) { worstSecond = Math.min(worstSecond, count * 1000 / sum); sum = 0; count = 0; }
        }
        const renderer = window.__observationGlobe.renderer();
        return { layer, mode, averageFps: sample.intervals.length * 1000 / (sample.last - sample.start), worstOneSecondFps: worstSecond,
          worstFrameMs: Math.max(...sample.intervals), drawCalls: renderer.info.render.calls, memory: { ...renderer.info.memory } };
      }, { layer, mode }));
    }
  }
  const scene = await page.evaluate(() => {
    const g = window.__observationGlobe, renderer = g.renderer(), gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), pixelRatio: renderer.getPixelRatio(),
      sameCanvas: window.__observationCanvas === document.querySelector('canvas'), canvasCount: document.querySelectorAll('canvas').length,
      cells: g.scene().getObjectByName('earth-analysis-hex-columns').count };
  });
  return { viewport: page.viewportSize(), secondsPerMode: 6, results, scene, workers: page.workers().map(worker => worker.url()) };
}
