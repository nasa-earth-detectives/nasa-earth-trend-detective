/**
 * Cuánto del mapa se distingue del azar. Con miles de celdas probadas a la vez, "p < 0,05" deja pasar
 * cientos por casualidad, y la persistencia de un año al siguiente infla el test aún más. Por eso se
 * enseñan los tres recuentos, del más permisivo al más exigente, en vez de uno solo.
 */
import type { HexCell, HexSignificance } from '../../types/hex.types';

const whole = new Intl.NumberFormat('es-CO');
const percent = new Intl.NumberFormat('es', { style: 'percent', maximumFractionDigits: 0 });
const twoDigits = new Intl.NumberFormat('es', { maximumSignificantDigits: 2 });
const probability = (symbol: string, value: number) =>
  (value < 0.001 ? `${symbol} < 0,001` : `${symbol} = ${twoDigits.format(value)}`);

export function HexSignificanceSummary({ significance }: { significance: HexSignificance }) {
  const { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate } = significance;
  const share = (cells: number) => (analyzed > 0 ? percent.format(cells / analyzed) : '—');
  return (
    <dl className="hex-significance" aria-label="Celdas con tendencia significativa, antes y después de corregir">
      <div><dt>Significativas al 95 %, sin corregir</dt><dd>{whole.format(uncorrected)}<span>{share(uncorrected)}</span></dd></div>
      <div><dt>Descontando la persistencia entre años</dt><dd>{whole.format(persistent)}<span>{share(persistent)}</span></dd></div>
      <div data-final><dt>Y los falsos hallazgos (FDR {percent.format(falseDiscoveryRate)})</dt>
        <dd>{whole.format(corrected)}<span>{share(corrected)}</span></dd></div>
    </dl>
  );
}

/** Veredicto de la celda elegida. No aparece con datos de muestra ni con una API que no lo envíe. */
export function HexCellVerdict({ cell }: { cell: HexCell }) {
  if (cell.pValue === undefined || cell.adjustedPValue === undefined || cell.robust === undefined) return null;
  const tone = cell.robust ? 'robust' : cell.pValue < 0.05 ? 'fragile' : 'none';
  return (
    <p className="hex-readout__verdict" data-tone={tone}>
      {tone === 'robust' && <>Tendencia sólida: supera la persistencia y el control de falsos hallazgos <span>{probability('q', cell.adjustedPValue)}</span></>}
      {tone === 'fragile' && <>Significativa sin corregir <span>{probability('p', cell.pValue)}</span>, pero no supera las correcciones <span>{probability('q', cell.adjustedPValue)}</span>: puede ser persistencia o azar</>}
      {tone === 'none' && <>No se distingue del azar <span>{probability('p', cell.pValue)}</span></>}
    </p>
  );
}
