/**
 * How much of the map stands out from chance. With thousands of cells tested at once, "p < 0.05"
 * lets hundreds pass by coincidence, and year-to-year persistence inflates the test even further.
 * That is why all three counts are shown, from most permissive to strictest, rather than just one.
 */
import type { HexCell, HexSignificance } from '../../types/hex.types';
import { useI18n } from '../../i18n';
import { formatTemplate, intlLocale } from '../../i18n/format';

export function HexSignificanceSummary({ significance }: { significance: HexSignificance }) {
  const { locale, t } = useI18n();
  const tag = intlLocale(locale);
  const whole = new Intl.NumberFormat(tag);
  const percent = new Intl.NumberFormat(tag, { style: 'percent', maximumFractionDigits: 0 });
  const { analyzed, uncorrected, persistent, corrected, falseDiscoveryRate } = significance;
  const share = (cells: number) => (analyzed > 0 ? percent.format(cells / analyzed) : '—');
  return (
    <dl className="hex-significance" aria-label={t.readouts.sigAria}>
      <div><dt>{t.readouts.sigUncorrected}</dt><dd>{whole.format(uncorrected)}<span>{share(uncorrected)}</span></dd></div>
      <div><dt>{t.readouts.sigPersistence}</dt><dd>{whole.format(persistent)}<span>{share(persistent)}</span></dd></div>
      <div data-final><dt>{formatTemplate(t.readouts.sigFdr, { fdr: percent.format(falseDiscoveryRate) })}</dt>
        <dd>{whole.format(corrected)}<span>{share(corrected)}</span></dd></div>
    </dl>
  );
}

/** Verdict for the selected cell. Hidden for sample data or an API that does not send it. */
export function HexCellVerdict({ cell }: { cell: HexCell }) {
  const { locale, t } = useI18n();
  if (cell.pValue === undefined || cell.adjustedPValue === undefined || cell.robust === undefined) return null;
  const twoDigits = new Intl.NumberFormat(intlLocale(locale), { maximumSignificantDigits: 2 });
  const probability = (symbol: string, value: number) =>
    (value < 0.001 ? `${symbol} < 0.001` : `${symbol} = ${twoDigits.format(value)}`);
  const tone = cell.robust ? 'robust' : cell.pValue < 0.05 ? 'fragile' : 'none';
  return (
    <p className="hex-readout__verdict" data-tone={tone}>
      {tone === 'robust' && <>{t.readouts.verdictRobust} <span>{probability('q', cell.adjustedPValue)}</span></>}
      {tone === 'fragile' && t.readouts.verdictFragile.split(/(\{[pq]\})/g).map((part) => (
        part === '{p}' ? <span key="p">{probability('p', cell.pValue!)}</span>
          : part === '{q}' ? <span key="q">{probability('q', cell.adjustedPValue!)}</span>
          : part
      ))}
      {tone === 'none' && <>{t.readouts.verdictNone} <span>{probability('p', cell.pValue)}</span></>}
    </p>
  );
}
