import type { GlobeInstance } from 'globe.gl';

interface SurfaceLocation { lat: number; lng: number }
const TAP_TOLERANCE_PX = 5;

/** Selección puntual con raycast actual; no depende del hover del frame anterior. */
export function createSurfaceSelection(globe: GlobeInstance, select: (location: SurfaceLocation) => void) {
  const canvas = globe.renderer().domElement;
  const pointers = new Set<number>();
  let candidate: { id: number; x: number; y: number; moved: boolean } | null = null;

  const clear = (): void => { candidate = null; pointers.clear(); };
  const movedFromStart = (event: PointerEvent): boolean => candidate !== null &&
    Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) > TAP_TOLERANCE_PX;
  const handleDown = (event: PointerEvent): void => {
    pointers.add(event.pointerId);
    candidate = pointers.size === 1 && event.button === 0
      ? { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false } : null;
  };
  const handleMove = (event: PointerEvent): void => {
    if (candidate?.id === event.pointerId && movedFromStart(event)) candidate.moved = true;
  };
  const handleUp = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (candidate?.id !== event.pointerId) return;
    const isTap = !candidate.moved && !movedFromStart(event) && pointers.size === 0;
    candidate = null;
    if (!isTap) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const location = globe.toGlobeCoords(x, y);
    if (location) select(location);
  };

  canvas.addEventListener('pointerdown', handleDown, { passive: true });
  window.addEventListener('pointermove', handleMove, { passive: true });
  window.addEventListener('pointerup', handleUp, { passive: true });
  window.addEventListener('pointercancel', clear);
  window.addEventListener('blur', clear);
  return () => {
    clear();
    canvas.removeEventListener('pointerdown', handleDown);
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleUp);
    window.removeEventListener('pointercancel', clear);
    window.removeEventListener('blur', clear);
  };
}
