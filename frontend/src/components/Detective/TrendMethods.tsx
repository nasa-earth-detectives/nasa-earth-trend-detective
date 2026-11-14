/**
 * Los otros dos métodos de significancia que nombra el reto, junto al veredicto de Mann-Kendall: el
 * intervalo de confianza de la pendiente y la prueba t de una regresión lineal. Enseñar si los dos
 * métodos coinciden vale más que dar un solo número: si no coinciden, el veredicto depende de cómo se
 * mire y conviene decirlo.
 */
import type { CellTrend } from '../../hooks/useCellTrend';

const rate = new Intl.NumberFormat('es', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const twoDigits = new Intl.NumberFormat('es', { maximumSignificantDigits: 2 });
const probability = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${twoDigits.format(p)}`);

function agreement(trend: CellTrend): string | null {
  const { linear } = trend;
  if (!linear) return null;
  if (!trend.isSignificant && !linear.isSignificant) return 'Sí: ninguno distingue la tendencia del azar.';
  if (trend.isSignificant && linear.isSignificant && Math.sign(trend.sensSlope) === Math.sign(linear.slope)) {
    return 'Sí: los dos ven la misma tendencia.';
  }
  return 'No: el veredicto depende del método. Hay que leerlo con prudencia.';
}

export function TrendMethods({ trend, unit }: { trend: CellTrend; unit: string }) {
  const { confidenceInterval95: interval, linear } = trend;
  const verdict = agreement(trend);
  if (!interval && !linear) return null;
  return (
    <dl className="inspection-methods">
      {interval && (
        <div>
          <dt>Intervalo de confianza del 95 % · Sen</dt>
          <dd>{rate.format(interval[0])} a {rate.format(interval[1])} <span>{unit}</span></dd>
        </div>
      )}
      {linear && (
        <div>
          <dt>Prueba t · regresión lineal</dt>
          <dd>{rate.format(linear.slope)} <span>{unit}</span> · {probability(linear.pValue)} · {linear.isSignificant ? 'significativa' : 'no significativa'}</dd>
        </div>
      )}
      {verdict && (
        <div>
          <dt>¿Coinciden los dos métodos?</dt>
          <dd>{verdict}</dd>
        </div>
      )}
    </dl>
  );
}
