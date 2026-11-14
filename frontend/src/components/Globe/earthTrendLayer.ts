import type { GlobeInstance } from 'globe.gl';
import { sampleHexColor } from '../../config/hexPalette';
import type { HexCell, HexDataset } from '../../types/hex.types';
import { createHexColumns } from './hexColumns';

type TrendCellHandler = (cell: HexCell | null) => void;

/**
 * Trend reading: height and color encode Sen's slope per year,
 * never the annual variable value. Mutually exclusive with the annual layer
 * so the globe never conflates two distinct scientific questions.
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
    // Fixed diverging palette: blue decreases, neutral unchanged, red increases.
    color: (cell, data, target) => sampleHexColor(cell.slope, data.heightDomain, target),
    // The dataset vertical domain is fixed, so two periods are compared on equal terms.
    magnitude: (cell, data) => Math.min(1, Math.abs(cell.slope) / data.heightDomain),
  });

  const inspectSelection = () => {
    if (selected) onSelectLocation?.({ lat: selected.latitude, lng: selected.longitude });
  };

  return {
    setDataset(next: HexDataset | null): void {
      if (disposed) return;
      // null means pending query; an empty list also hides previous readout.
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
