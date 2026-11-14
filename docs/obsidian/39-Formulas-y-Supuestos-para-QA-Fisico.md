# 39 · Fórmulas, supuestos y puntos abiertos para la revisión de física

Para **Emilse Cabrera** (física climática y QA). Reúne las fórmulas que se añadieron o cambiaron el
2026-11-14 en la rama `feat/merra2-real-data`, cómo se comprobó cada una y, sobre todo, qué **no**
está hecho y necesita su criterio. Complementa el inventario de [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]].

Registro de cifras: [[37-MERRA2-Datos-Reales-y-Casos-Opuestos]]. Cómo funciona todo: [[38-Como-Funciona-El-Detective-De-Tendencias]].

---

## 1. Qué cambia respecto al inventario de la nota 34

| Tema | Lo que dice la nota 34 | Cómo está ahora |
| :--- | :--- | :--- |
| IC del 95 % de Sen | índices $\lfloor (N \mp C_\alpha)/2 \rfloor$ | Corregido: ver 2.7. El límite inferior quedaba una posición alto. |
| Pares de tendencias opuestas | 3 pares sobre "series lineales de referencia" | 4 pares calculados con la serie real de cada celda. Las rectas se eliminaron. |
| Años incompletos | `MinMonthsPerYear = 9` para toda la grilla | Depende de la variable: 9 en datos mensuales, 1 en anuales (2.4). |
| Prueba t | no existía | Añadida (2.8 y 2.9). |
| NDVI | rango $[-0.2, 1.0]$ | En el producto va de 0 a 1: GIBS publica transparente el NDVI $\le 0$ (2.5). |
| GRACE y OCO-2 | tasas como $-262$ Gt/año en los casos | Siguen siendo demostración. Esas cifras escritas a mano se quitaron de la interfaz. |
| Pre-blanqueamiento lag-1 | pendiente | **Sigue pendiente.** Ver la medición de la sección 4. |

Las tareas `[PHYS-T2]` y `[PHYS-T3]` dependen de GRACE y OCO-2, que todavía no tienen datos reales.

---

## 2. Fórmulas añadidas o cambiadas

### 2.1 Decodificación de los datos de NASA POWER
`scripts/etl/power_zarr.py`. Cada bloque del Zarr viene comprimido (Blosc) y con un filtro de escala fija:

$$x = \frac{e}{s} + o \qquad (s = 100,\; o = 1000)$$

donde $e$ es el valor almacenado. Lo aplica la librería `numcodecs`.
**Comprobado:** la serie leída coincide con la API pública de POWER para el punto (3° S, 60° O) en los
45 años, con diferencia máxima de 0,01 (el redondeo de la API).

### 2.2 Regrillado a 2° ponderado por área
`scripts/etl/power_grid.py`. Pesos separables en latitud y longitud:

$$w^{\phi}_{b,i} = \max\!\big(0,\; \sin\phi^{\text{sup}}_{b,i} - \sin\phi^{\text{inf}}_{b,i}\big), \qquad
w^{\lambda}_{c,j} = \text{solape en grados entre la celda nativa } j \text{ y la destino } c$$

$$\bar{x}_{b,c} = \frac{\sum_{i,j} w^{\phi}_{b,i}\, w^{\lambda}_{c,j}\, x_{i,j}\, v_{i,j}}{\sum_{i,j} w^{\phi}_{b,i}\, w^{\lambda}_{c,j}\, v_{i,j}}$$

con $v_{i,j} = 1$ si la celda nativa tiene dato y 0 si no. La diferencia de senos es el área de una
banda de latitud sobre la esfera. Si el dato cubre menos del 50 % del área de la celda destino, la
celda queda sin valor.
**Comprobado:** la media mundial ponderada es la misma antes y después. Temperatura: 14,297 °C y
14,297 °C (1981). Precipitación de GPM: 2,7797 y 2,7797 mm/día (1998).

### 2.3 Anomalía
$$a_{c,t} = x_{c,t} - \frac{1}{N_b}\sum_{\tau \in \text{base}} x_{c,\tau}$$

Periodo base: 1991–2020 en MERRA-2, 2001–2020 en GPM IMERG (empieza en 1998) y 1951–1980 en GISTEMP
(viene así de origen). La pendiente es idéntica con valor o con anomalía. **Las anomalías de fuentes
distintas no son comparables entre sí** porque tienen bases distintas.

### 2.4 Media anual y años incompletos
`VariableCadence.cs`. En datos mensuales (GISTEMP, NDVI) el año es la media de sus meses y sólo cuenta
si tiene al menos 9. En datos anuales (MERRA-2, GPM) se usa la media anual que calcula NASA POWER.
Una celda necesita al menos 10 años para tener veredicto (`MinYearsPerCell`).

### 2.5 NDVI a partir de la paleta de GIBS
`scripts/etl/gibs_ndvi_to_csv.py`. La imagen asigna a cada color un intervalo $[v_{\min}, v_{\max})$:

$$\text{NDVI} = \frac{v_{\min} + v_{\max}}{2}, \qquad |\text{error}| \le \frac{v_{\max} - v_{\min}}{2} \le 0{,}005$$

Son 142 clases de 0,005 a 0,01 de ancho. Después se promedia por área como en 2.2.

### 2.6 Mann-Kendall
Sin cambios respecto a la nota 34: $S$, $\operatorname{Var}(S)$ con corrección por empates, $Z$ con
corrección de continuidad y valor p bilateral.

### 2.7 Intervalo de confianza del 95 % de la pendiente de Sen (corregido)
`SensSlopeEstimator.cs`. Con las $N$ pendientes por pares ordenadas de menor a mayor y
$C_\alpha = z_{0{,}975}\sqrt{\operatorname{Var}(S)}$ (Sen, 1968):

$$i_{\inf} = \max\!\Big(\operatorname{round}\!\big(\tfrac{N - C_\alpha}{2}\big) - 1,\; 0\Big), \qquad
i_{\sup} = \min\!\Big(\operatorname{round}\!\big(\tfrac{N + C_\alpha}{2}\big),\; N - 1\Big)$$

en índices que empiezan en 0. El redondeo es al par más cercano, igual que `scipy.stats.theilslopes`.

### 2.8 Regresión lineal y prueba t de la pendiente
`LinearTrendTest.cs`. Con $t_i$ el año y $x_i$ el valor:

$$b = \frac{\sum (t_i - \bar t)(x_i - \bar x)}{\sum (t_i - \bar t)^2}, \qquad
s_b = \sqrt{\frac{\sum (x_i - a - b\,t_i)^2}{(n-2)\sum (t_i - \bar t)^2}}, \qquad T = \frac{b}{s_b}$$

$$\text{IC}_{95} = b \pm t_{0{,}975,\,n-2}\; s_b$$

con $a = \bar x - b\,\bar t$ y $n - 2$ grados de libertad.

### 2.9 Distribución t de Student
`StudentTDistribution.cs`. Valor p bilateral con la función beta incompleta regularizada:

$$p = I_{\frac{\nu}{\nu + T^2}}\!\left(\frac{\nu}{2}, \frac{1}{2}\right), \qquad \nu = n - 2$$

evaluada con la fracción continua de Lentz y $\ln\Gamma$ por Lanczos. El valor crítico se obtiene por
bisección.

**Comprobado (2.7 a 2.9):** contra SciPy 1.18.1 en tres series, una real. Coinciden a 6 decimales la
pendiente de Sen y su intervalo, la pendiente lineal, su error, $T$ y su intervalo; el valor p, con
error relativo menor que $10^{-6}$. Para la precipitación de MERRA-2 en (5° S, 61° O): Sen $-0{,}025477$
con intervalo $[-0{,}043182;\ -0{,}004688]$; regresión $-0{,}019973$, $T = -2{,}1230$, $p = 0{,}03955$.

### 2.10 Criterio de significancia y "coinciden los métodos"
Significativo si $p < 0{,}05$. La tarjeta dice que los métodos coinciden cuando Mann-Kendall y la prueba
t son los dos significativos con el mismo signo, o ninguno lo es. Si discrepan, lo dice.

### 2.11 Pares de tendencias opuestas
`OpposingTrendsService.cs`. Un par se muestra sólo si las dos celdas tienen datos, al menos 10 años y
$\operatorname{sgn}(Q_A) \ne \operatorname{sgn}(Q_B)$. El índice de divergencia no se tocó:

$$D = |Z_{\text{sube}} - Z_{\text{baja}}| \cdot \big(1 + |Q_{\text{sube}} - Q_{\text{baja}}|\big)$$

---

## 3. Unidades

| Variable | Unidad del valor | Unidad de la tendencia | Nota |
| :--- | :--- | :--- | :--- |
| Temperatura del aire a 2 m (MERRA-2) | °C | °C / año | media anual |
| Precipitación (MERRA-2 y GPM) | mm/día | mm/día / año | 1 mm = 1 L/m² |
| Evaporación en tierra (MERRA-2) | mm/día | mm/día / año | sólo tierra |
| Humedad del suelo, zona de raíces | fracción 0–1 | fracción / año | adimensional; sólo tierra |
| NDVI (MODIS Terra) | adimensional, 0–1 | NDVI / año | mensual |
| GISTEMP | °C de anomalía | °C / año | base 1951–1980 |

"Por década" es la pendiente anual multiplicada por 10. Los dominios de las escalas de color son el
percentil 99 medido en los datos: son presentación, no umbrales físicos.

---

## 4. Autocorrelación lag-1: medida, no corregida

Ni Mann-Kendall ni la prueba t corrigen la autocorrelación serial. El producto **no** aplica
pre-blanqueamiento. Como punto de partida para `[PHYS-T4]` se midió fuera del producto, con
$r_1$ sobre los residuos tras quitar la pendiente de Sen y con TFPW (Yue et al., 2002):

| Serie | $n$ | $r_1$ | p de M-K | p con TFPW | ¿Cambia el veredicto? |
| :--- | ---: | ---: | ---: | ---: | :--- |
| Temperatura, centro-oeste de Brasil | 45 | +0,41 | 7,2e-14 | 1,9e-13 | no |
| Temperatura, norte de Bangladés | 45 | +0,55 | 5,7e-04 | 1,9e-06 | no |
| Precipitación, Bangladés oriental | 45 | +0,60 | 9,7e-10 | 2,0e-11 | no |
| Precipitación, occidente de Venezuela | 45 | +0,33 | 6,5e-12 | 2,6e-10 | no |
| Humedad del suelo, extremo oriente ruso | 45 | +0,11 | 1,8e-12 | 6,5e-12 | no |
| Humedad del suelo, Ontario y Quebec | 45 | +0,60 | 1,0e-10 | 6,5e-12 | no |
| Evaporación, Gansu | 45 | +0,24 | 5,6e-11 | 8,6e-13 | no |
| Evaporación, sureste de Brasil | 45 | +0,24 | 4,6e-12 | 1,3e-12 | no |
| Precipitación MERRA-2, Amazonía | 45 | +0,31 | 1,6e-02 | 2,7e-02 | no |
| Precipitación GPM, Amazonía | 28 | +0,16 | 8,3e-01 | 4,3e-01 | no (sigue sin tendencia) |
| NDVI, norte de India | 26 | +0,10 | 2,2e-08 | 8,9e-08 | no |
| NDVI, Sahel | 26 | +0,52 | 2,0e-03 | 3,6e-05 | no |
| GISTEMP, Svalbard | 26 | +0,28 | 1,3e-04 | 1,2e-04 | no |

Lectura: la autocorrelación es apreciable (hasta +0,60), pero en estas trece series el veredicto no
cambia. Son las series más marcadas; **no se ha medido en las celdas con p cercano a 0,05**, que es
donde puede cambiar. TFPW también puede abaratar el valor p (pasa en varias filas): conviene comparar
con la corrección de varianza de Hamed y Rao (1998) antes de adoptar uno.

---

## 5. Puntos abiertos para tu criterio

1. **Autocorrelación** (sección 4): decidir si se implementa TFPW o corrección de varianza. El sitio
   para engancharlo es `TrendStatisticsEngine.Analyze`.
2. **Comparaciones múltiples.** La grilla prueba cada celda por separado al 5 %. Sólo por azar se
   esperan unas 810 "significativas" de 16.200 (unas 229 de las 4.573 de tierra). No hay corrección
   (por ejemplo, tasa de falsos descubrimientos). Los recuentos medidos van de 1.287 (NDVI, de
   3.094 celdas) a 12.043 (temperatura del aire, de 16.200).
3. **Sesgo de selección en los pares.** Se eligieron entre las celdas de mayor $|Z|$: son extremos de
   la grilla, no celdas al azar. Sirven para ilustrar, no para estimar un efecto típico.
4. **Sin mecanismo físico.** Los pares dicen que dos regiones van en sentidos opuestos, no que las una
   un proceso. Los dos arcos de contexto (ENSO y polvo del Sahara) son ilustrativos y están marcados
   así. Esto toca `[PHYS-T1]`.
5. **Índice de divergencia** (2.11): suma un número sin unidades con una diferencia de pendientes que
   sí las tiene, así que su valor depende de la unidad de la variable. No se muestra en la interfaz.
6. **MERRA-2 es un reanálisis.** Sus tendencias, sobre todo en precipitación, pueden incluir cambios
   en el sistema de observación. En (5° S, 61° O) MERRA-2 da un descenso significativo (1981–2025) y
   GPM IMERG no ve tendencia (1998–2025): otra fuente y menos años.
7. **GPM IMERG** figura como "reviewing" en NASA POWER.
8. **NDVI.** La media anual sale de los meses con dato (al menos 9); en latitudes con nieve faltan
   meses de invierno y la celda puede quedar sin serie. El NDVI $\le 0$ no entra.
9. **Supuestos de la prueba t:** residuos normales, de varianza constante e independientes. No se
   comprueban.
10. **Sólo tendencias lineales**, que es el alcance que fija el reto. No se quita el ciclo estacional
    porque se trabaja con medias anuales.
11. **Nombres de región** de los pares: son etiquetas geográficas aproximadas de una celda de 2°.

---

## 6. Cómo reproducir una cifra

Con la API en local (`npm run dev`):

```
GET http://localhost:5000/api/trends?variable=Merra2Precipitation&startYear=1981&endYear=2025&latitude=-5&longitude=-61
```

Devuelve la serie anual (`observations`), la pendiente de Sen (`sensSlope`), su intervalo
(`confidenceInterval95`), Z y p de Mann-Kendall, y la prueba t (`linear`). Los valores de referencia
de SciPy están fijados en `backend/tests/NasaTrendDetective.Tests/ScientificValidation/SciPyCrossValidationTests.cs`.

## Referencias

- Sen, P. K. (1968). *Estimates of the regression coefficient based on Kendall's tau.* JASA 63.
- Yue, S., Pilon, P., Phinney, B., Cavadias, G. (2002). *The influence of autocorrelation on the ability to detect trend in hydrological series.* Hydrol. Process. 16.
- Hamed, K. H., Rao, A. R. (1998). *A modified Mann-Kendall trend test for autocorrelated data.* J. Hydrol. 204.
- Gelaro, R., et al. (2017). *MERRA-2.* J. Climate 30, doi:10.1175/JCLI-D-16-0758.1.
