/**
 * How much of the map stands out from chance. With thousands of cells tested at once, "p < 0.05"
 * lets hundreds pass by coincidence, and year-to-year persistence inflates the test even further.
 * That is why all three counts are shown, from most permissive to strictest, rather than just one.
 */
import type { HexCell, HexSignificance } from '../../types/hex.types';
import { formatNumber, formatProbability, formatTemplate, useI18n } from '../../i18n';

export function HexSignificanceSummary({ significance }: { significance: HexSignificance }) {
  const { locale, t } = useI18n();
  const { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate } = significance;
  const share = (cells: number) => (analyzed > 0 ? formatNumber(cells / analyzed, 'percent0', locale) : '—');
  return (
    <dl className="hex-significance" aria-label={t.readouts.sigAria}>
      <div><dt>{t.readouts.sigUncorrected}</dt><dd>{formatNumber(uncorrected, 'whole', locale)}<span>{share(uncorrected)}</span></dd></div>
      <div><dt>{t.readouts.sigPersistence}</dt><dd>{formatNumber(persistent, 'whole', locale)}<span>{share(persistent)}</span></dd></div>
      <div data-final><dt>{formatTemplate(t.readouts.sigFdr, { fdr: formatNumber(falseDiscoveryRate, 'percent0', locale) })}</dt>
        <dd>{formatNumber(corrected, 'whole', locale)}<span>{share(corrected)}</span></dd></div>
    </dl>
  );
}

/** Verdict for the selected cell. Hidden for sample data or an API that does not send it. */
export function HexCellVerdict({ cell }: { cell: HexCell }) {
  const { locale, t } = useI18n();
  if (cell.pValue === undefined || cell.adjustedPValue === undefined || cell.robust === undefined) return null;
  const tone = cell.robust ? 'robust' : cell.pValue < 0.05 ? 'fragile' : 'none';
  return (
    <p className="hex-readout__verdict" data-tone={tone}>
      {tone === 'robust' && <>{t.readouts.verdictRobust} <span>{formatProbability('q', cell.adjustedPValue, locale)}</span></>}
      {tone === 'fragile' && t.readouts.verdictFragile.split(/(\{[pq]\})/g).map((part) => (
        part === '{p}' ? <span key="p">{formatProbability('p', cell.pValue!, locale)}</span>
          : part === '{q}' ? <span key="q">{formatProbability('q', cell.adjustedPValue!, locale)}</span>
          : part
      ))}
      {tone === 'none' && <>{t.readouts.verdictNone} <span>{formatProbability('p', cell.pValue, locale)}</span></>}
    </p>
  );
}
