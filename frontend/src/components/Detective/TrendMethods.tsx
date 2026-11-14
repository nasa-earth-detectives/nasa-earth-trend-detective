/**
 * Lo que acompaña al veredicto de Mann-Kendall: el intervalo de confianza de la pendiente, la prueba t
 * de una regresión lineal (los otros dos métodos que nombra el reto) y el mismo Mann-Kendall después de
 * descontar la persistencia entre años. Enseñar si el veredicto se sostiene vale más que dar un solo
 * número: si depende del método, o de suponer que cada año es independiente, conviene decirlo.
 */
import type { CellTrend } from '../../hooks/useCellTrend';

const rate = new Intl.NumberFormat('es', { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
const twoDigits = new Intl.NumberFormat('es', { maximumSignificantDigits: 2 });
const probability = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${twoDigits.format(p)}`);

function agreement(trend: CellTrend): string | null {
  const { linear, prewhitened } = trend;
  if (!linear) return null;
  if (!trend.isSignificant && !linear.isSignificant) return 'Sí: ningún método distingue la tendencia del azar.';
  if (trend.isSignificant && linear.isSignificant && Math.sign(trend.sensSlope) === Math.sign(linear.slope)) {
    if (prewhitened && !prewhitened.isSignificant) {
      return 'Con reservas: los dos métodos ven la tendencia, pero no supera la corrección por persistencia. '
        + 'Puede ser una racha larga y no un cambio sostenido.';
    }
    return prewhitened ? 'Sí: los métodos coinciden y la tendencia supera la corrección por persistencia.'
      : 'Sí: los dos ven la misma tendencia.';
  }
  return 'No: el veredicto depende del método. Hay que leerlo con prudencia.';
}

/** Con r1 por debajo de 0,05 el backend no toca la serie: el veredicto corregido es el clásico. */
function persistence(trend: CellTrend): string | null {
  const { prewhitened } = trend;
  if (!prewhitened) return null;
  const r1 = `r₁ = ${twoDigits.format(prewhitened.lag1Autocorrelation)}`;
  if (prewhitened.lag1Autocorrelation < 0.05) return `${r1} · despreciable: el veredicto no cambia`;
  const outcome = prewhitened.isSignificant ? 'sigue siendo significativa'
    : trend.isSignificant ? 'deja de ser significativa' : 'no significativa';
  return `${r1} · ${probability(prewhitened.pValue)} al descontarla · ${outcome}`;
}

export function TrendMethods({ trend, unit }: { trend: CellTrend; unit: string }) {
  const { confidenceInterval95: interval, linear } = trend;
  const verdict = agreement(trend);
  const persistent = persistence(trend);
  if (!interval && !linear && !persistent) return null;
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
      {persistent && (
        <div>
          <dt>Persistencia entre años · Mann-Kendall con preblanqueo</dt>
          <dd>{persistent}</dd>
        </div>
      )}
      {verdict && (
        <div>
          <dt>¿Se sostiene el veredicto?</dt>
          <dd>{verdict}</dd>
        </div>
      )}
    </dl>
  );
}
