import { useState, useCallback } from 'react';
import { Download, Share2, Check } from 'lucide-react';
import type { TimeSeriesDataPoint } from '../../types/detective.types';
import type { ClimateVariable } from '../../types/climate.types';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';

interface DetectiveExportActionsProps {
  seriesData: TimeSeriesDataPoint[];
  variable: ClimateVariable;
  location: SelectedLocation;
  year: number;
  unit: string;
  isObserved: boolean;
}

/** Data export actions (CSV) and regional shareable link. */
import { useI18n } from '../../i18n';

export function DetectiveExportActions({
  seriesData,
  variable,
  location,
  year,
  unit,
  isObserved,
}: DetectiveExportActionsProps) {
  const { locale, t } = useI18n();
  const [copied, setCopied] = useState(false);

  const handleDownloadCsv = useCallback(() => {
    if (!seriesData.length) return;
    const cleanUnit = unit.replace(/"/g, '""');
    const header = 'year,value,unit,variable,latitude,longitude,data_type\n';
    const rows = seriesData.map(d =>
      `${d.year},${d.value.toFixed(4)},"${cleanUnit}",${variable},${location.lat.toFixed(4)},${location.lng.toFixed(4)},${isObserved ? 'observed' : 'synthetic_demo'}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `nasa-trend-${variable}-${location.lat.toFixed(2)}_${location.lng.toFixed(2)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, [seriesData, variable, location, unit, isObserved]);

  const handleShareUrl = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('variable', variable);
    url.searchParams.set('lat', location.lat.toFixed(4));
    url.searchParams.set('lng', location.lng.toFixed(4));
    url.searchParams.set('year', String(year));
    if (locale !== 'en') url.searchParams.set('lang', locale);
    else url.searchParams.delete('lang');

    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      // Fallback if Clipboard API lacks permissions
      prompt(t.inspection.copyPrompt, url.toString());
    });
  }, [variable, location, year, locale, t.inspection.copyPrompt]);

  return (
    <div className="inspection-actions">
      <button
        type="button"
        className="inspection-action-btn focus-ring"
        onClick={handleDownloadCsv}
        disabled={!seriesData.length}
        title={t.inspection.downloadCsvTitle}
        aria-label={t.inspection.downloadCsvTitle}
      >
        <Download size={14} strokeWidth={2} aria-hidden="true" />
        <span>{t.inspection.downloadCsv}</span>
      </button>

      <button
        type="button"
        className={`inspection-action-btn focus-ring ${copied ? 'is-copied' : ''}`}
        onClick={handleShareUrl}
        title={t.inspection.shareTitle}
        aria-label={copied ? t.inspection.copiedAria : t.inspection.shareAria}
      >
        {copied ? (
          <>
            <Check size={14} strokeWidth={2} aria-hidden="true" />
            <span aria-live="polite">{t.inspection.copied}</span>
          </>
        ) : (
          <>
            <Share2 size={14} strokeWidth={2} aria-hidden="true" />
            <span>{t.inspection.share}</span>
          </>
        )}
      </button>
    </div>
  );
}
