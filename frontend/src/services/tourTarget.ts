/** Espera el montaje de React y las transiciones finitas; nunca mide un panel oculto. */
export function waitForTourTarget(selector: string, signal: AbortSignal): Promise<HTMLElement | null> {
  return new Promise(resolve => {
    let frame = 0;
    let previous = '';
    let stableFrames = 0;
    const started = performance.now();
    const finish = (element: HTMLElement | null) => {
      cancelAnimationFrame(frame);
      signal.removeEventListener('abort', cancel);
      resolve(element);
    };
    const cancel = () => finish(null);
    const check = () => {
      if (signal.aborted) { finish(null); return; }
      const element = document.querySelector<HTMLElement>(selector);
      const rect = element?.getBoundingClientRect();
      const style = element && getComputedStyle(element);
      const visible = rect && rect.width > 0 && rect.height > 0 &&
        style?.visibility !== 'hidden' && Number(style?.opacity) > 0 && !element?.closest('[inert]');
      const box = visible ? [rect.x, rect.y, rect.width, rect.height].map(value => value.toFixed(1)).join(',') : '';
      const moving = element?.closest('main')?.getAnimations({ subtree: true }).some(animation =>
        animation.playState === 'running' && animation.effect?.getComputedTiming().iterations !== Infinity);
      stableFrames = box && box === previous && !moving ? stableFrames + 1 : 0;
      previous = box;
      if (stableFrames >= 3) { finish(element); return; }
      // Un destino que no llegó a montarse no se sustituye por un globo de ayuda en el centro.
      if (performance.now() - started > 2000) { finish(null); return; }
      frame = requestAnimationFrame(check);
    };
    if (signal.aborted) { resolve(null); return; }
    signal.addEventListener('abort', cancel, { once: true });
    frame = requestAnimationFrame(check);
  });
}
