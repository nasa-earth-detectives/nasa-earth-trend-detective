/**
 * Layout effects that only synchronize state with the 3D scene. Kept separate so
 * ImmersiveEarthLayout stays below the CI line limit; they add no own state.
 */
import { useEffect, type RefObject } from 'react';
import { SATELLITE_TIMELINE } from '../../config/climateLayers';
import { analysisAreaOf, framingAltitude } from '../../config/wizardOptions';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation } from '../../types/climate.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import type { HexCell, HexDataset } from '../../types/hex.types';
import type { GlobeReading } from '../../types/observationLayer.types';
import type { GlobeSceneApi } from '../Globe/useGlobeScene';

type SceneRef = RefObject<GlobeSceneApi | null>;

/** Trend reading: scene mode, grid data, and cell selection. */
export function useTrendReadingSync(sceneApiRef: SceneRef, reading: GlobeReading, trendData: HexDataset | null,
  setSelectedTrendCell: (cell: HexCell | null) => void, setSelectedObservation: (item: ClimateObservation | null) => void) {
  const trendReading = reading === 'trend';
  useEffect(() => {
    sceneApiRef.current?.setReadingMode?.(reading);
    setSelectedTrendCell(null);
    if (reading === 'trend') setSelectedObservation(null);
  }, [sceneApiRef, reading, setSelectedTrendCell, setSelectedObservation]);
  useEffect(() => {
    const api = sceneApiRef.current;
    api?.setTrendCellSelectHandler?.(setSelectedTrendCell);
    return () => api?.setTrendCellSelectHandler?.(null);
  }, [sceneApiRef, setSelectedTrendCell]);
  useEffect(() => {
    if (!trendReading) return;
    sceneApiRef.current?.setTrendData?.(trendData);
    setSelectedTrendCell(null);
  }, [sceneApiRef, trendReading, trendData, setSelectedTrendCell]);
}

/**
 * Shifts framing so an open panel does not cover the planet: left when the layer panel opens
 * (right) and right when the startup briefing is open (left).
 */
export function useFocusOffset(sceneApiRef: SceneRef, panelOpen: boolean, briefingOpen = false) {
  useEffect(() => {
    const updateOffset = () => {
      const wide = window.innerWidth >= 1024;
      const offset = briefingOpen && wide ? Math.min(250, Math.max(150, window.innerWidth * 0.16))
        : panelOpen && wide ? -Math.min(210, Math.max(110, window.innerWidth * 0.1)) : 0;
      const verticalOffset = panelOpen && window.innerWidth < 1024 && window.innerHeight > window.innerWidth
        ? -Math.min(130, window.innerHeight * 0.15) : 0;
      sceneApiRef.current?.setFocusOffset(offset, verticalOffset);
    };
    updateOffset();
    window.addEventListener('resize', updateOffset);
    return () => window.removeEventListener('resize', updateOffset);
  }, [sceneApiRef, panelOpen, briefingOpen]);
}

/**
 * Timeline year range. Each real source provides its coverage (MERRA-2: 1981-2025;
 * GISTEMP: 2000-present): with a fixed range, choosing a MERRA-2 variable left the current year
 * without data and the globe empty. If the active year falls outside, it clamps to the nearest end.
 */
export function useCoverageTimeline(provenance: DatasetProvenance | null,
  loading: boolean, year: number, onYearChange: (year: number) => void) {
  const real = provenance !== null;
  const startYear = real ? provenance.coverageStart : SATELLITE_TIMELINE.startYear;
  const endYear = real ? provenance.coverageEnd : SATELLITE_TIMELINE.endYear;
  useEffect(() => {
    // While loading, provenance still belongs to the previous variable: do not clamp using it.
    if (loading) return;
    if (year > endYear) onYearChange(endYear);
    else if (year < startYear) onYearChange(startYear);
  }, [loading, year, startYear, endYear, onYearChange]);
  return { startYear, endYear };
}

/**
 * Locations requested from outside the scene by the wizard. Preview only points the globe
 * from afar; on confirm, the camera descends to the place and opens its inspection.
 */
export function useFocusLocation(sceneApiRef: SceneRef, focusLocation: SelectedLocation | null,
  previewLocation: SelectedLocation | null, selectLocation: (location: SelectedLocation) => void) {
  useEffect(() => {
    if (previewLocation) sceneApiRef.current?.flyToGodsEye?.(previewLocation.lat, previewLocation.lng, framingAltitude(previewLocation, 1.7), 1300);
  }, [sceneApiRef, previewLocation]);
  useEffect(() => {
    if (!focusLocation) return;
    sceneApiRef.current?.flyToGodsEye?.(focusLocation.lat, focusLocation.lng, framingAltitude(focusLocation, 0.45), 1500);
    selectLocation(focusLocation);
  }, [sceneApiRef, focusLocation, selectLocation]);
}

/**
 * What is being analysed is drawn on the globe: the box of the region, or the 2° box and a marker for a
 * point. While the briefing is open it follows the answer being considered.
 */
export function useAnalysisArea(sceneApiRef: SceneRef, location: SelectedLocation | null, previewLocation: SelectedLocation | null) {
  const shown = previewLocation ?? location;
  useEffect(() => {
    sceneApiRef.current?.setAnalysisArea?.(shown ? analysisAreaOf(shown) : null);
  }, [sceneApiRef, shown]);
}
