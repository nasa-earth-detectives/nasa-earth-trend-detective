import type { ProjectedValue } from '../../utils/trendProjection';
import { formatTemplate, intlLocale, useI18n } from '../../i18n';
import '../../styles/trend-projection.css';

interface TrendProjectionProps {
  /** One entry per future year shown; empty when the record is too short to carry forward. */
  projection: ProjectedValue[];
  unit: string;
  /** Whether the trend passed its significance test: the projection of a trend that did not says little. */
  significant: boolean;
}

/** Where the series would be in future years if its trend went on unchanged, with the range of each year. */
export function TrendProjection({ projection, unit, significant }: TrendProjectionProps) {
  const { locale, t } = useI18n();
  const tag = intlLocale(locale);
  const format = (value: number): string => value.toLocaleString(tag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (projection.length === 0) return <p className="trend-projection__note">{t.places.projectionTooShort}</p>;
  return (
    <section className="trend-projection" aria-label={t.places.projectionTitle}>
      <h3>{t.places.projectionTitle}</h3>
      <dl>
        {projection.map(item => (
          <div key={item.year}>
            <dt>{item.year}</dt>
            <dd>
              <strong>{format(item.value)}</strong> {unit}
              <span>{formatTemplate(t.places.projectionRange, { low: format(item.low), high: format(item.high) })}</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="trend-projection__note">{significant ? t.places.projectionNote : t.places.projectionWeak}</p>
    </section>
  );
}
