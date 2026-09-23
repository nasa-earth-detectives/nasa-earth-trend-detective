/** Reposo de la instrumentación, sin mover controles ni actualizar por frame. */
import { useEffect, useRef, useState } from 'react';

const IDLE_DELAY_MS = 5000;
const CONTROL_SELECTOR = '[data-ui-control]';

interface IdleUiOptions {
  /** Panel abierto, reproducción temporal o foco dentro de la instrumentación. */
  disabled: boolean;
}

export function useIdleUi({ disabled }: IdleUiOptions): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const idleRef = useRef(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pressedPointers = new Set<number>();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let overControl = Boolean(document.querySelector(`${CONTROL_SELECTOR}:hover`));

    const isControl = (target: EventTarget | null): boolean =>
      target instanceof Element && Boolean(target.closest(CONTROL_SELECTOR));

    const hasKeyboardFocus = (): boolean =>
      isControl(document.activeElement) && Boolean(document.activeElement?.matches(':focus-visible'));

    const blocked = (): boolean =>
      disabled || !finePointer.matches || reducedMotion.matches || document.hidden ||
      overControl || pressedPointers.size > 0 || hasKeyboardFocus();

    const wake = (): void => {
      if (timer) clearTimeout(timer);
      if (idleRef.current) {
        idleRef.current = false;
        setIsIdle(false);
      }
      if (!blocked()) {
        timer = setTimeout(() => {
          if (!blocked()) {
            idleRef.current = true;
            setIsIdle(true);
          }
        }, IDLE_DELAY_MS);
      }
    };

    const handlePointer = (event: PointerEvent): void => {
      overControl = event.pointerType !== 'touch' &&
        isControl(event.type === 'pointerout' ? event.relatedTarget : event.target);
      if (event.type === 'pointerdown') pressedPointers.add(event.pointerId);
      if (event.type === 'pointerup' || event.type === 'pointercancel') {
        pressedPointers.delete(event.pointerId);
      }
      wake();
    };

    const handleBlur = (): void => {
      pressedPointers.clear();
      overControl = false;
      wake();
    };
    const handleMediaChange = (): void => {
      overControl = finePointer.matches && Boolean(document.querySelector(`${CONTROL_SELECTOR}:hover`));
      wake();
    };

    const pointerEvents = ['pointermove', 'pointerover', 'pointerout', 'pointerdown', 'pointerup', 'pointercancel'] as const;
    pointerEvents.forEach((event) => window.addEventListener(event, handlePointer, { passive: true }));
    window.addEventListener('keydown', wake);
    window.addEventListener('wheel', wake, { passive: true });
    window.addEventListener('focusin', wake);
    window.addEventListener('focusout', wake);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', wake);
    finePointer.addEventListener('change', handleMediaChange);
    reducedMotion.addEventListener('change', handleMediaChange);
    wake();

    return () => {
      if (timer) clearTimeout(timer);
      pointerEvents.forEach((event) => window.removeEventListener(event, handlePointer));
      window.removeEventListener('keydown', wake);
      window.removeEventListener('wheel', wake);
      window.removeEventListener('focusin', wake);
      window.removeEventListener('focusout', wake);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', wake);
      finePointer.removeEventListener('change', handleMediaChange);
      reducedMotion.removeEventListener('change', handleMediaChange);
    };
  }, [disabled]);

  return disabled ? false : isIdle;
}
