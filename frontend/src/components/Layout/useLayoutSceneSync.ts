/**
 * Efectos del layout que sólo sincronizan estado con la escena 3D. Viven aparte para que
 * ImmersiveEarthLayout quede por debajo del límite de líneas de la CI; no añaden estado propio.
 */
import { useEffect, type RefObject } from 'react';
import { SATELLITE_TIMELINE } from '../../config/climateLayers';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import type { ClimateObservation } from '../../types/climate.types';
import type { DatasetProvenance } from '../../types/dataset.types';
import type { HexCell, HexDataset } from '../../types/hex.types';
import type { GlobeReading, ObservationSource } from '../../types/observationLayer.types';
import type { GlobeSceneApi } from '../Globe/useGlobeScene';

type SceneRef = RefObject<GlobeSceneApi | null>;

/** Lectura de tendencia: modo de la escena, datos de la grilla y selección de celda. */
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
 * Desplaza el encuadre para que un panel abierto no tape el planeta: a la izquierda si se abre el
 * panel de capas (derecha) y a la derecha si está el expediente de inicio (izquierda).
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
 * Rango de años de la línea de tiempo. Cada fuente real trae su cobertura (MERRA-2: 1981-2025;
 * GISTEMP: 2000-hoy): con el rango fijo, al elegir una variable de MERRA-2 el año en curso quedaba
 * sin datos y el globo, vacío. Si el año activo cae fuera, se lleva al extremo más cercano.
 */
export function useCoverageTimeline(source: ObservationSource, provenance: DatasetProvenance | null,
  loading: boolean, year: number, onYearChange: (year: number) => void) {
  const real = source === 'api' && provenance !== null;
  const startYear = real ? provenance.coverageStart : SATELLITE_TIMELINE.startYear;
  const endYear = real ? provenance.coverageEnd : SATELLITE_TIMELINE.endYear;
  useEffect(() => {
    // Mientras carga, la procedencia todavía es la de la variable anterior: no se corrige con ella.
    if (loading) return;
    if (year > endYear) onYearChange(endYear);
    else if (year < startYear) onYearChange(startYear);
  }, [loading, year, startYear, endYear, onYearChange]);
  return { startYear, endYear };
}

/**
 * Lugares pedidos desde fuera de la escena por el asistente. La vista previa sólo orienta el globo,
 * desde lejos; al confirmar, la cámara baja al lugar y se abre su inspección.
 */
export function useFocusLocation(sceneApiRef: SceneRef, focusLocation: SelectedLocation | null,
  previewLocation: SelectedLocation | null, selectLocation: (location: SelectedLocation) => void) {
  useEffect(() => {
    if (previewLocation) sceneApiRef.current?.flyToGodsEye?.(previewLocation.lat, previewLocation.lng, 1.7, 1300);
  }, [sceneApiRef, previewLocation]);
  useEffect(() => {
    if (!focusLocation) return;
    sceneApiRef.current?.flyToGodsEye?.(focusLocation.lat, focusLocation.lng, 0.45, 1500);
    selectLocation(focusLocation);
  }, [sceneApiRef, focusLocation, selectLocation]);
}
