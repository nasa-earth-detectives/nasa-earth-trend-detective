import { useCallback, useEffect, useState } from 'react';

export type InstrumentMode = 'observation' | 'layers' | 'time' | 'view' | 'inspection';
export type LayerTab = 'data' | 'view';
export interface SelectedLocation { lat: number; lng: number }

/** La intención cambia la composición; el estado científico permanece independiente. */
export function useImmersiveUi() {
  const [mode, setMode] = useState<InstrumentMode>('observation');
  const [location, setLocation] = useState<SelectedLocation | null>(null);
  const observe = useCallback(() => setMode('observation'), []);
  const openMode = useCallback((next: InstrumentMode) => setMode(next), []);
  const toggleMode = useCallback((next: InstrumentMode) => {
    setMode(current => current === next ? 'observation' : next);
  }, []);
  const selectLocation = useCallback((next: SelectedLocation) => {
    setLocation(next);
    setMode('inspection');
  }, []);
  const setLayerTab = useCallback((tab: LayerTab) => setMode(tab === 'data' ? 'layers' : 'view'), []);
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mode !== 'observation') {
        observe();
        requestAnimationFrame(() => {
          document.querySelector<HTMLButtonElement>(`[data-mode-trigger="${mode}"]`)?.focus({ preventScroll: true });
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, observe]);
  return { mode, location, observe, openMode, toggleMode, selectLocation, setLayerTab };
}
