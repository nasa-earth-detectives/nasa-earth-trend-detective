/**
 * How much of the map stands out from chance. With thousands of cells tested at once, "p < 0.05"
 * lets hundreds pass by coincidence, and year-to-year persistence inflates the test even further.
 * That is why all three counts are shown, from most permissive to strictest, rather than just one.
 */
import type { HexCell, HexSignificance } from '../../types/hex.types';

const whole = new Intl.NumberFormat('en-US');
const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });
const twoDigits = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 2 });
const probability = (symbol: string, value: number) =>
  (value < 0.001 ? `${symbol} < 0.001` : `${symbol} = ${twoDigits.format(value)}`);

export function HexSignificanceSummary({ significance }: { significance: HexSignificance }) {
  const { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate } = significance;
  const share = (cells: number) => (analyzed > 0 ? percent.format(cells / analyzed) : '—');
  return (
    <dl className="hex-significance" aria-label="Cells with significant trends, before and after correction">
      <div><dt>Significant at 95%, uncorrected</dt><dd>{whole.format(uncorrected)}<span>{share(uncorrected)}</span></dd></div>
      <div><dt>Accounting for year-to-year persistence</dt><dd>{whole.format(persistent)}<span>{share(persistent)}</span></dd></div>
      <div data-final><dt>And false discoveries (FDR {percent.format(falseDiscoveryRate)})</dt>
        <dd>{whole.format(corrected)}<span>{share(corrected)}</span></dd></div>
    </dl>
  );
}

/** Verdict for the selected cell. Hidden for sample data or an API that does not send it. */
export function HexCellVerdict({ cell }: { cell: HexCell }) {
  if (cell.pValue === undefined || cell.adjustedPValue === undefined || cell.robust === undefined) return null;
  const tone = cell.robust ? 'robust' : cell.pValue < 0.05 ? 'fragile' : 'none';
  return (
    <p className="hex-readout__verdict" data-tone={tone}>
      {tone === 'robust' && <>Robust trend: passes persistence and false discovery control <span>{probability('q', cell.adjustedPValue)}</span></>}
      {tone === 'fragile' && <>Significant uncorrected <span>{probability('p', cell.pValue)}</span>, but fails corrections <span>{probability('q', cell.adjustedPValue)}</span>: may be persistence or chance</>}
      {tone === 'none' && <>Indistinguishable from chance <span>{probability('p', cell.pValue)}</span></>}
    </p>
  );
}
