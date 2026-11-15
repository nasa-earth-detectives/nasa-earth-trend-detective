import { useCallback, useEffect, useState } from 'react';

export type InstrumentMode = 'observation' | 'layers' | 'time' | 'view' | 'inspection';
export type LayerTab = 'data' | 'view';
/**
 * Where the analysis looks. With radii it is a whole region (its box, centred on lat/lng); without
 * them it is one point and the 2° box around it. regionId names the preset region it belongs to;
 * placeName, the place it was found as in the search box.
 */
export interface SelectedLocation {
  lat: number; lng: number; regionId?: string; latRadius?: number; lngRadius?: number; placeName?: string;
}

/** Intent alters layout composition; scientific state remains independent. */
export function useImmersiveUi(initialLocation: SelectedLocation | null = null) {
  const [mode, setMode] = useState<InstrumentMode>(initialLocation ? 'inspection' : 'observation');
  const [location, setLocation] = useState<SelectedLocation | null>(initialLocation);
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
