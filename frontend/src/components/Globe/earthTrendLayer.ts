import type { GlobeInstance } from 'globe.gl';
import { sampleHexColor } from '../../config/hexPalette';
import type { HexCell, HexDataset } from '../../types/hex.types';
import { createHexColumns } from './hexColumns';

type TrendCellHandler = (cell: HexCell | null) => void;

/**
 * Lectura de tendencia: altura y color codifican la pendiente de Sen por año,
 * nunca el valor anual de la variable. Es excluyente con la capa anual para que
 * un mismo globo no mezcle dos preguntas científicas distintas.
 */
export function createEarthTrendLayer(
  globe: GlobeInstance,
  onSelectLocation?: (location: { lat: number; lng: number }) => void,
) {
  let onCellSelect: TrendCellHandler | null | undefined;
  let selected: HexCell | null = null;
  let disposed = false;
  const columns = createHexColumns(globe, cell => {
    selected = cell;
    onCellSelect?.(cell);
  }, {
    transitionMs: 600,
    transitionColors: true,
    // Paleta divergente fija: azul desciende, neutro sin cambio, rojo aumenta.
    color: (cell, data, target) => sampleHexColor(cell.slope, data.heightDomain, target),
    // El dominio vertical del dataset es fijo, así dos periodos se comparan en igualdad.
    magnitude: (cell, data) => Math.min(1, Math.abs(cell.slope) / data.heightDomain),
  });

  const inspectSelection = () => {
    if (selected) onSelectLocation?.({ lat: selected.latitude, lng: selected.longitude });
  };

  return {
    setDataset(next: HexDataset | null): void {
      if (disposed) return;
      // null significa consulta pendiente; una lista vacía también oculta la lectura anterior.
      columns.setDataset(next && next.cells.length ? next : null);
    },
    setVisible(visible: boolean): void {
      if (!disposed) columns.setVisible(visible);
    },
    setOnCellSelect(handler?: TrendCellHandler | null): void {
      onCellSelect = handler;
    },
    select(id: string | null): void {
      if (disposed) return;
      columns.select(id);
      inspectSelection();
    },
    pick(x: number, y: number): boolean {
      if (disposed) return false;
      const hit = columns.pick(x, y);
      if (hit) inspectSelection();
      return hit;
    },
    dispose(): void {
      if (disposed) return;
      disposed = true;
      columns.dispose();
      selected = null;
      onCellSelect = undefined;
    },
  };
}
