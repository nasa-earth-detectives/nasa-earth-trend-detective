# 🔬 Implementación del Motor Científico y REST API [S2-T1, S2-T3, S3-T1, S3-T3, S4-T1, S4-T3]

Volver al [[00-Map-Of-Content]] | [[05-Rigor-Cientifico-MannKendall]] | [[22-Almacen-Columnar-DuckDB]] | [[15-Trazabilidad-ClickUp-Sprint-2]]

---

## 🎯 Objetivo General
Implementar en C# .NET 10 el núcleo estadístico-científico de modelado de tendencias temporales (Mann-Kendall con corrección por empates, estimador de Pendiente de Sen e intervalos al 95%), el motor de tendencias opuestas (Opposing Trends) con casos emblemáticos de la NASA y la capa de exposición REST segura con Rate Limiting, caching y RFC 7807 ProblemDetails.

---

## 🏛️ Arquitectura Modular (Anti God-Class & Clean Architecture)

### 1. Capa de Dominio (`NasaTrendDetective.Domain`)
- **`Enums/TrendDirection.cs`**: `Increasing`, `Decreasing`, `Stable`.
- **`Enums/TrendSignificance.cs`**: `SignificantlyIncreasing`, `SignificantlyDecreasing`, `NonSignificant`.
- **`Entities/StatisticalVerdict.cs`**: Veredicto estadístico inmutable conteniendo $S$, $\text{Var}(S)$, $Z$, valor $p$, pendiente de Sen, pendiente decenal, intervalo de confianza al 95% `double[]` y significancia.
- **`Entities/AnnualObservation.cs`**: Observación anual estructurada `(Year, Value, Anomaly)`.
- **`Entities/RegionalTrendSummary.cs`**: Resumen analítico por región con geolocalización y serie temporal.
- **`Entities/OpposingTrendPair.cs`**: Par teleconectado de divergencia regional con índice cuantitativo y justificación física.

### 2. Capa de Aplicación - Estadísticas (`NasaTrendDetective.Application/Statistics`)
- **`NormalDistribution.cs`**: Aproximación numérica de alta precisión de Abramowitz & Stegun para la función de distribución acumulada normal $\Phi(z)$ y valor $p$ bilateral ($\text{error} < 1.5 \times 10^{-7}$).
- **`MannKendallCalculator.cs`**:
  - Estadístico $S = \sum_{k=1}^{n-1} \sum_{j=k+1}^n \text{sign}(x_j - x_k)$.
  - Varianza $\text{Var}(S) = \frac{n(n-1)(2n+5) - \sum t_i(t_i-1)(2t_i+5)}{18}$ con corrección por empates (*ties*).
  - Puntuación $Z$ estandarizada y umbral al 95% de confianza ($|Z| > 1.95996 \iff p < 0.05$).
- **`SensSlopeEstimator.cs`**:
  - Mediana de todas las pendientes bilaterales $Q_{jk} = (x_j - x_k)/(t_j - t_k)$.
  - Intervalos de confianza no paramétricos al 95% derivados de $\text{Var}(S)$.
  - Estimación decenal ($Q \times 10.0$).
- **`TrendStatisticsEngine.cs`**: Orquestador unificado que combina ambos algoritmos y genera el `StatisticalVerdict`.

### 3. Capa de Aplicación - Servicios (`NasaTrendDetective.Application/Implements`)
- **`OpposingTrendsService.cs`**:
  - Implementa `IOpposingTrendsService`.
  - Provee los 3 casos emblemáticos documentados por la NASA:
    1. **Ártico vs Atlántico Norte**: Calentamiento acelerado ($+0.70^\circ\text{C}$/década) vs agujero de enfriamiento subpolar por desaceleración de la AMOC.
    2. **Sur de China vs Cuenca Amazónica**: Reverdecimiento antropogénico (NDVI $+0.028$/década) vs degradación forestal y sequías recurrentes.
    3. **Groenlandia vs Antártida Oriental**: Pérdida masiva de hielo glacial ($-260\text{ Gt/año}$) vs estabilidad de la meseta antártica.
  - Método `EvaluatePair` para cálculo dinámico del índice de divergencia:
    $$\text{Divergence} = |Z_1 - Z_2| \times (1 + |\text{Slope}_1 - \text{Slope}_2|)$$
- **`TrendAnalysisService.cs`**:
  - Conecta con `ITrendObservationRepository` (DuckDB en `Infrastructure`).
  - Soporta análisis sobre demanda de series arbitrarias provistas por el cliente (`AnalyzeCustomSeriesAsync`).
  - Caching en memoria para respuestas ultra-rápidas.

### 4. Capa de Infraestructura (`NasaTrendDetective.Infrastructure/Implements`)
- **`TrendObservationRepository.cs`**:
  - Implementa `ITrendObservationRepository`.
  - Ejecuta consultas agregadas sobre la tabla `fact_climate_observations` de DuckDB mediante `$varId`, `$startYear`, `$endYear` y filtros espaciales.
  - Incluye fallback determinista para demostración fluida en caso de celdas sin datos cargados previamente.

### 5. Capa de API y Seguridad (`NasaTrendDetective.Api`)
- **`TrendsController.cs`**:
  - `GET /api/trends`: Consulta con filtros temporales, geoespaciales y variable climática. Cacheado con `IMemoryCache` (TTL 10 min).
  - `POST /api/trends/analyze`: Cálculo directo de Mann-Kendall y Sen para cualquier serie enviada por el inspector o frontend.
  - `GET /api/trends/observations`: Observaciones satelitales anuales.
  - `GET /api/trends/opposing`: Casos de tendencias opuestas preconfigurados.
- **`OpposingTrendsController.cs`**:
  - `GET /api/opposing-trends`: Listado completo de pares teleconectados.
  - `GET /api/opposing-trends/{pairId}`: Detalle de un caso particular.
- **`Middlewares/ExceptionHandlingMiddleware.cs`**: Formato estándar de errores RFC 7807 (`application/problem+json`).
- **`Middlewares/BotDetectionMiddleware.cs`**: Mitigación de bots, Honeypot header `X-Honeypot-Token`, User-Agent obligatorio y bloqueo de firmas de explotación.

---

## 🧪 Cobertura de Pruebas Automatizadas (125 Tests)

1. **`MannKendallCalculatorTests`**: Verificación de monotonicidad creciente estricta, decreciente, series constantes nulas, corrección matemática de empates y muestras pequeñas.
2. **`SensSlopeEstimatorTests`**: Verificación de pendientes exactas, robustez frente a *outliers* extremos e intervalos de confianza al 95%.
3. **`OpposingTrendsServiceTests`**: Validación de casos emblemáticos NASA y evaluador dinámico de divergencias.
4. **`NasaCrossValidationTests`**: Validación cruzada estadística frente a informes satelitales de la NASA:
   - Ártico GISTEMP: pendiente decenal converge en el rango $[+0.60^\circ\text{C}, +0.80^\circ\text{C}]$ con $Z > 1.96$ ($p < 0.05$).
   - Groenlandia GRACE-FO: tasa de pérdida converge en el rango $[-240, -280]\text{ Gt/año}$ con $Z < -1.96$.
5. **`TrendsControllerIntegrationTests`**: Pruebas end-to-end con `WebApplicationFactory<Program>`, validando códigos de estado HTTP 200, 400 ProblemDetails (años invertidos), 403 Forbidden (Bot Shield) y 400 Bad Request (Honeypot).
