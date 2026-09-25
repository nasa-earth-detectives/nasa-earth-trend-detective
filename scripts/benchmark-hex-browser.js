/** Ejecutar con playwright-cli run-code; ver docs/s2-t4-palette-performance.md. Sólo instrumenta esta sesión de prueba. */
async (page) => {
  await page.unroute('**/src/services/hexDataSource.ts*');
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  await page.route('**/src/services/hexDataSource.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    const needle = 'import.meta.env.VITE_HEX_DEMO_PROFILE ?? "global"';
    if (!body.includes(needle)) throw new Error('No se encontró el perfil de prueba');
    await route.fulfill({ response, body: body.replace(needle, '"stress"') });
  });
  await page.route('**/src/components/Globe/useGlobeScene.ts*', async route => {
    const response = await route.fetch();
    const body = await response.text();
    if (!body.includes('globe.backgroundColor(')) throw new Error('No se encontró Globe');
    await route.fulfill({ response, body: body.replace('globe.backgroundColor(', 'window.__hexBenchmarkGlobe = globe; globe.backgroundColor(') });
  });
  const countVisible = () => page.evaluate(() => {
    const globe = window.__hexBenchmarkGlobe;
    const mesh = globe.scene().getObjectByName('earth-analysis-hex-columns');
    const camera = globe.camera();
    const point = camera.position.clone(), clip = camera.position.clone();
    mesh.updateWorldMatrix(true, false);
    let visible = 0;
    for (let i = 0; i < mesh.count; i++) {
      const a = mesh.instanceMatrix.array, j = i * 16;
      point.set(a[j + 12] + a[j + 4] * .5, a[j + 13] + a[j + 5] * .5, a[j + 14] + a[j + 6] * .5).applyMatrix4(mesh.matrixWorld);
      const dx = point.x - camera.position.x, dy = point.y - camera.position.y, dz = point.z - camera.position.z;
      const distance = Math.hypot(dx, dy, dz);
      const b = (camera.position.x * dx + camera.position.y * dy + camera.position.z * dz) / distance;
      const discriminant = b * b - (camera.position.lengthSq() - 10000);
      if (discriminant >= 0 && -b - Math.sqrt(discriminant) < distance - .02) continue;
      clip.copy(point).project(camera);
      if (Math.abs(clip.x) < 1 && Math.abs(clip.y) < 1 && clip.z > -1 && clip.z < 1) visible++;
    }
    return visible;
  });
  const results = [];
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.reload();
  await page.waitForFunction(() => window.__hexBenchmarkGlobe?.scene().getObjectByName('earth-analysis-hex-columns')?.count === 6211);
  await page.waitForFunction(() => document.querySelector('[data-earth-surface]')?.dataset.earthSurface === 'ready');
  await page.waitForTimeout(1600);
  await page.evaluate(() => { window.__hexBenchmarkCanvas = document.querySelector('canvas'); });
  // Fuera del muestreo FPS: verifica también que otras columnas no tapen las tapas.
  const unobstructedCaps = await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').map(entry => entry.name)
      .find(name => /\/three\.js\?/.test(name));
    if (!url) throw new Error('No se encontró el runtime Three ya cargado');
    const { Raycaster, Vector3 } = await import(url);
    const globe = window.__hexBenchmarkGlobe;
    const mesh = globe.scene().getObjectByName('earth-analysis-hex-columns');
    const camera = globe.camera(), ray = new Raycaster(), point = new Vector3(), direction = new Vector3();
    const hits = [];
    let count = 0;
    mesh.updateWorldMatrix(true, false);
    for (let i = 0; i < mesh.count; i++) {
      const a = mesh.instanceMatrix.array, j = i * 16;
      point.set(a[j + 12] + a[j + 4] * .5, a[j + 13] + a[j + 5] * .5, a[j + 14] + a[j + 6] * .5).applyMatrix4(mesh.matrixWorld);
      direction.copy(point).sub(camera.position).normalize();
      ray.set(camera.position, direction);
      hits.length = 0;
      mesh.raycast(ray, hits);
      let nearest = null;
      for (const hit of hits) if (!nearest || hit.distance < nearest.distance) nearest = hit;
      if (nearest?.instanceId === i) count++;
    }
    return count;
  });
  if (unobstructedCaps <= 5000) throw new Error(`Sólo ${unobstructedCaps} tapas sin oclusión`);
  for (const mode of ['idle', 'hover', 'orbit', 'zoom', 'variable', 'timeline']) {
    await page.getByRole('button', { name: 'Recentrar la Tierra' }).click();
    await page.waitForTimeout(1000);
    const before = await countVisible();
    if (before <= 5000) throw new Error(`Sólo ${before} columnas frontales al comenzar ${mode}`);
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
    const after = await countVisible();
    if (after <= 5000) throw new Error(`Sólo ${after} columnas frontales al terminar ${mode}`);
    results.push(await page.evaluate(({ mode, before, after }) => {
      const sample = window.__hexBenchmark;
      let sum = 0, count = 0, worstSecond = Infinity;
      for (const ms of sample.intervals) { sum += ms; count++; if (sum >= 1000) { worstSecond = Math.min(worstSecond, count * 1000 / sum); sum = 0; count = 0; } }
      return { mode, frontVisibleBefore: before, frontVisibleAfter: after, averageFps: sample.intervals.length * 1000 / (sample.last - sample.start), worstOneSecondFps: worstSecond, worstFrameMs: Math.max(...sample.intervals) };
    }, { mode, before, after }));
  }
  const scene = await page.evaluate(() => {
    const g = window.__hexBenchmarkGlobe, renderer = g.renderer(), gl = renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
    return { gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), pixelRatio: renderer.getPixelRatio(), calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, memory: renderer.info.memory, sameCanvas: window.__hexBenchmarkCanvas === document.querySelector('canvas'), canvasCount: document.querySelectorAll('canvas').length };
  });
  await page.screenshot({ path: 'output/playwright/hex-stress-final.png' });
  await page.unroute('**/src/services/hexDataSource.ts*');
  await page.unroute('**/src/components/Globe/useGlobeScene.ts*');
  return { fixture: 'stress', cells: 6211, unobstructedCaps, viewport: page.viewportSize(), secondsPerMode: 6, results, scene };
}
