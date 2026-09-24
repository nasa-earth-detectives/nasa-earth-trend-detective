/** Viewport móvil en GPU de escritorio: no certifica un teléfono físico. Ejecutar con playwright-cli run-code. */
async (page) => {
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  await page.route('**/src/components/Globe/useGlobeScene.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    if (!body.includes('globe.backgroundColor(')) throw new Error('No se encontró Globe');
    await route.fulfill({ response, body: body.replace('globe.backgroundColor(',
      'window.__observationGlobe = globe; globe.backgroundColor(') });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.waitForFunction(() => window.__observationGlobe?.scene().getObjectByName('earth-analysis-hex-columns')?.count > 0);
  await page.waitForFunction(() => document.querySelector('[data-earth-surface]')?.dataset.earthSurface === 'ready');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__observationCanvas = document.querySelector('canvas'); });
  const results = [];
  for (const mode of ['idle', 'orbit', 'timeline']) {
    await page.evaluate(() => {
      const renderer = window.__observationGlobe.renderer();
      window.__mobileSample = { start: performance.now(), last: performance.now(), frame: renderer.info.render.frame, intervals: [], done: false };
      const tick = now => {
        const sample = window.__mobileSample;
        if (renderer.info.render.frame !== sample.frame) {
          sample.intervals.push(now - sample.last);
          sample.last = now; sample.frame = renderer.info.render.frame;
        }
        if (now - sample.start >= 5000) { sample.done = true; return; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (mode === 'orbit') {
      await page.mouse.move(190, 390); await page.mouse.down();
      for (let i = 0; i < 8; i++) await page.mouse.move(i % 2 ? 230 : 190, i % 2 ? 410 : 390, { steps: 24 });
      await page.mouse.up();
    } else if (mode === 'timeline') {
      await page.getByRole('button', { name: 'Tiempo', exact: true }).click();
      for (const year of ['2010', '2020', '2024']) {
        await page.getByRole('slider', { name: 'Año de consulta', exact: true }).fill(year);
        await page.waitForTimeout(800);
      }
      await page.keyboard.press('Escape');
    }
    await page.waitForFunction(() => window.__mobileSample.done);
    results.push(await page.evaluate(mode => {
      const s = window.__mobileSample;
      let duration = 0, frames = 0, worstOneSecondFps = Infinity;
      for (const ms of s.intervals) {
        duration += ms; frames++;
        if (duration >= 1000) { worstOneSecondFps = Math.min(worstOneSecondFps, frames * 1000 / duration); duration = 0; frames = 0; }
      }
      return { mode, averageFps: s.intervals.length * 1000 / (s.last - s.start), worstOneSecondFps, worstFrameMs: Math.max(...s.intervals) };
    }, mode));
  }
  const resources = [];
  for (let cycle = 0; cycle < 5; cycle++) {
    await page.getByRole('button', { name: 'Variables', exact: true }).click();
    for (const mode of ['Mapa de calor', 'Hexágonos 3D']) {
      await page.getByRole('radio', { name: mode, exact: true }).click();
      await page.waitForTimeout(1100);
    }
    await page.keyboard.press('Escape');
    resources.push(await page.evaluate(() => ({ ...window.__observationGlobe.renderer().info.memory })));
  }
  const scene = await page.evaluate(() => {
    const g = window.__observationGlobe, renderer = g.renderer(), gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), pixelRatio: renderer.getPixelRatio(),
      quality: document.querySelector('[data-earth-quality]')?.dataset.earthQuality,
      sameCanvas: window.__observationCanvas === document.querySelector('canvas'), canvasCount: document.querySelectorAll('canvas').length,
      cells: g.scene().getObjectByName('earth-analysis-hex-columns').count, drawCalls: renderer.info.render.calls };
  });
  return { viewport: page.viewportSize(), emulatedOnDesktop: true, results, resources, scene };
}
