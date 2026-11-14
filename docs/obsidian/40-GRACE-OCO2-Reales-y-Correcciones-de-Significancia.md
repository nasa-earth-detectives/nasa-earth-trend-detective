# 40 · GRACE y CO₂ reales, y dos correcciones a la significancia

Registro del 2026-11-14 (tarde), rama `feat/grace-oco2-significance`. Cierra los dos avisos que quedaban
abiertos en [[39-Formulas-y-Supuestos-para-QA-Fisico]]: dos variables seguían siendo demostración y el
veredicto no corregía ni la autocorrelación ni las comparaciones múltiples. Cada cifra de esta nota está
medida; donde no se pudo medir, se dice.

Para **Emilse**: las fórmulas están en las secciones 3 y 4, y lo que necesita tu criterio en la 8.

---

## 1. Qué cambia

| Antes | Ahora |
| :--- | :--- |
| 7 de 9 variables con datos reales | **9 de 9.** GRACE y CO₂ dejan de ser demostración. |
| Un veredicto: Mann-Kendall al 95 % | El mismo, más el veredicto **descontando la persistencia** entre años. |
| El mapa contaba cada celda por separado | El mapa da tres recuentos: sin corregir, sin persistencia y con **control de falsos hallazgos**. |
| "Sube" o "baja" si p < 0,05 | Sólo si además supera la corrección por persistencia. |

Lo que no cambia: los ocho casos de Brasil y Bangladés siguen siendo significativos y opuestos (sección 5).
Lo que sí: **la lluvia de MERRA-2 en la Amazonía (5° S, 61° O) ya no se puede presentar como un descenso
significativo.** Pasa de p = 0,016 a p = 0,091.

---

## 2. Los datos nuevos

### 2.1 GRACE y GRACE-FO: agua y hielo en tierra

- **Fuente:** mascons de NASA Goddard (GSFC), solución RL06v2.0 OBP-ICE6GD. Se descargan sin cuenta, en
  texto: 41.168 mascons de 1° de igual área, 258 soluciones mensuales de abril de 2002 a junio de 2026,
  en centímetros de agua equivalente respecto a la media 2004–2009. El paquete pesa 58,6 MB.
- **Por qué no la capa de GRACE de NASA GIBS:** su paleta satura en ±30 cm. Medido en estos mismos datos:
  4.257 de los 12.896 mascons de tierra superan ese valor algún mes, justo donde está la señal.
- **Qué se usa:** los 12.896 mascons de tierra y hielo apoyado (Groenlandia 198, Antártida 1.053, golfo de
  Alaska 42, resto de tierra 11.603). Fuera quedan el océano (28.140, miden presión en el fondo) y las
  plataformas de hielo flotante (132).
- **Regrillado:** cada mascon es un rectángulo en latitud y longitud y se reparte en la grilla de 2° por
  área de solape, como en la nota 39 (2.2). Una celda con menos de la mitad de su área en tierra no entra.
- **Resultado:** 5.832 celdas, 252 meses (hasta diciembre de 2025), 1.469.664 filas, Parquet de 7,0 MB.
  Valores de −967 a +195 cm.

**Comprobado:**
- Los rectángulos cubren la esfera sin huecos ni solapes: la suma de áreas da 12,566371 (4π) y la
  cobertura de cada celda de 2° es 1,000000.
- El área calculada de cada mascon coincide con la del fichero entre −0,22 % y +0,45 %.
- La media de tierra ponderada por área cambia como máximo 0,029 cm al regrillar.
- Los dos mascons polares vienen centrados en el polo: son un casquete de medio grado, no medio casquete.
  Tratarlos como el resto dejaba sin cubrir el 4,7 % de la celda polar.

**Meses por año** (decide qué años entran, con la regla de 9 meses): 2002: 7 · 2003: 11 · 2004–2010: 12 ·
2011–2012: 10 · 2013–2016: 9 · 2017: 5 · 2018: 5 · 2019–2025: 12. Entran **21 años**: 2003–2016 y
2019–2025. El hueco entre las dos misiones no se imputa.

| Celda | Pendiente de Sen | p clásico | p sin persistencia |
| :--- | ---: | ---: | ---: |
| Sureste de Groenlandia (69° N, 33° O) | −24,66 cm/año | 2,8e-10 | 1,4e-06 |
| Antártida, mar de Amundsen (75° S, 105° O) | −44,64 cm/año | 2,8e-10 | 2,7e-09 |
| Glaciares de Alaska (61° N, 141° O) | −20,04 cm/año | 4,1e-10 | 7,5e-06 |
| Norte de India (29° N, 77° E) | −5,43 cm/año | 1,3e-09 | 7,2e-08 |
| California (37° N, 121° O) | −1,72 cm/año | 5,1e-06 | 6,1e-04 |
| Amazonía central (5° S, 61° O) | +0,83 cm/año | 0,16 | 0,36 |
| Interior de Groenlandia (72° N, 40° O) | +0,37 cm/año | 0,075 | — |

El interior de Groenlandia casi no cambia: la pérdida está en la costa. El glosario ponía de ejemplo el
interior; se cambió al sureste.

### 2.2 CO₂ de OCO-2

- **Fuente:** capa `OCO-2_Carbon_Dioxide_Total_Column_Average` de NASA GIBS, sin cuenta. Según los
  metadatos de la capa, pinta el producto OCO2_L2_Lite_FP V11.2r de GES DISC: XCO₂, la media de CO₂ en
  toda la columna de aire.
- **Cómo se recupera el dato:** igual que el NDVI (nota 39, 2.5). La paleta oficial asigna a cada color un
  intervalo de 0,4 ppm entre 380 y 480 ppm, así que el error es de ±0,2 ppm.
- **Por qué el WMS y no las teselas:** OCO-2 mide una franja de unos 10 km. Medido para el 2015-07-01: en
  el nivel 2 de teselas quedan 1.505 píxeles con dato; pidiendo el planeta entero al WMS a 0,07°, 6.085,
  todos con un color de la paleta, y en una sola petición por día.
- **Descarga:** 3.922 imágenes diarias (2014-09-06 a 2025-12-31), 255 MB, unos 50 minutos. Convertirlas
  tarda 4 min 54 s.
- **Por qué media anual y no mensual:** la franja no llena una celda de 2° cada mes. Con la regla de las
  variables mensuales (10 sondeos por celda y mes, 9 meses al año) sólo 192 celdas tenían serie casi
  completa en 2015–2023.
- **Regla adoptada:** un mes cuenta con 3 sondeos o más; un año, con 6 meses o más. El valor del año es la
  **media de las medias mensuales**, para que un mes con muchos sondeos no pese más que otro.
- **Cuánto cambia el resultado al relajar la regla:** en las 192 celdas comunes la pendiente cambia
  +0,014 ppm/año de media (desviación 0,034), un 0,6 %.
- **Resultado:** 2015–2025 (2014 no llega a un año), 13.105.886 sondeos en 3.814 días, 55.632 filas, entre
  4.381 y 5.524 celdas por año, Parquet de 0,13 MB. Ningún sondeo fuera del rango de la paleta; 202
  píxeles de un único color ajeno a ella, descartados y contados en el manifiesto.

| Medida | Valor |
| :--- | :--- |
| Celdas con tendencia (10 años o más) | 3.139 |
| Pendiente: mediana (mínimo a máximo) | +2,473 ppm/año (2,303 a 2,696) |
| Trópicos · 30–60° N · 30–60° S | 2,470 · 2,510 · 2,457 ppm/año |
| Valor mediano en 2015 · 2020 · 2025 | 398,7 · 411,5 · 424,4 ppm |
| Hawái (19° N, 155° O), 2015 → 2025 | 399,9 → 426,4 ppm, +2,51 ppm/año |

**Límites que hay que decir:**
- El CO₂ sube en **todas** las celdas y casi al mismo ritmo: aquí no hay "tendencias opuestas". Es la
  variable que enseña lo contrario, un cambio global.
- No hay serie donde las nubes o el polvo dejan pocos sondeos: la Amazonía central y Colombia no tienen;
  el Sahara central, sólo algunos años (de marzo a junio hay 0 sondeos). Nada por encima de 60° de latitud.
- Es la media de la columna, no el CO₂ a ras de suelo.
- **Descartado, AIRS** (la otra capa de CO₂ de GIBS): su paleta sólo cubre de 390 a 405 ppmv. Medido: el
  100 % de los píxeles de 2003 y 2006 y el 98,5 % de 2009 caen en la clase "menos de 390".

---

## 3. Persistencia entre años

### 3.1 El problema

Mann-Kendall supone que cada año es independiente del anterior. Si hay persistencia, toma las rachas por
tendencia. Se midió con series simuladas **sin** tendencia (ruido AR(1)): con φ = 0,5 el test clásico da
por significativa una de cada cuatro.

### 3.2 Qué se midió antes de elegir

2.000 series por caso, nivel nominal 5 %. Cada casilla: % de series con p < 0,05 para una tendencia de
**0** (falsos positivos) / **0,05** / **0,12** desviaciones típicas por año.

| Caso | Clásico | Preblanqueo simple | TFPW | **Iterativo** | Iterativo + sesgo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 25 años, φ = 0 | 4,2 / 38,0 / 97,1 | 4,0 / 20,6 / 57,3 | 4,9 / 35,8 / 95,6 | **3,6 / 33,1 / 94,5** | 3,4 / 29,1 / 89,7 |
| 25 años, φ = 0,3 | 13,3 / 41,3 / 94,5 | 3,8 / 11,0 / 32,6 | 13,7 / 39,8 / 93,0 | **8,8 / 29,3 / 81,8** | 5,2 / 21,2 / 68,0 |
| 25 años, φ = 0,5 | 22,7 / 47,2 / 91,3 | 4,5 / 9,3 / 21,8 | 25,9 / 49,8 / 90,9 | **12,8 / 28,9 / 73,2** | 7,5 / 17,2 / 48,3 |
| 25 años, φ = 0,7 | 36,8 / 51,6 / 87,9 | 6,7 / 10,3 / 21,9 | 44,3 / 58,7 / 89,5 | **19,4 / 29,6 / 64,5** | 9,2 / 14,6 / 32,2 |
| 45 años, φ = 0 | 4,0 / 98,9 / 100 | 4,0 / 92,0 / 93,2 | 4,5 / 98,2 / 100 | **3,5 / 98,0 / 100** | 3,1 / 96,7 / 100 |
| 45 años, φ = 0,3 | 13,8 / 94,7 / 100 | 4,8 / 62,0 / 75,8 | 16,4 / 94,3 / 100 | **8,0 / 85,0 / 100** | 5,8 / 78,5 / 99,8 |
| 45 años, φ = 0,5 | 24,7 / 90,0 / 100 | 5,8 / 36,9 / 55,2 | 30,0 / 91,0 / 100 | **11,6 / 69,7 / 99,9** | 8,1 / 57,2 / 97,5 |
| 45 años, φ = 0,7 | 38,5 / 86,0 / 100 | 6,0 / 21,8 / 43,9 | 50,5 / 89,5 / 100 | **15,5 / 56,8 / 98,2** | 8,7 / 35,6 / 78,0 |

En una pasada previa (1.000 series, con `pymannkendall`) la corrección de varianza de Hamed y Rao dio de
6 a 32 % de falsos positivos, y la de Yue y Wang con todos los retardos, de 46 a 60 %.

Lectura:
- **TFPW** (Yue et al., 2002), el que figuraba en `[PHYS-T4]`: da **más** falsos positivos que no corregir.
  Vuelve a sumar la tendencia entera sobre un ruido que el blanqueo ya ha encogido.
- **Preblanqueo simple** (von Storch, 1995): controla los falsos positivos, pero borra tendencias reales
  porque mide r₁ con la tendencia dentro.
- **Iterativo** (Zhang et al., 2000; Wang y Swail, 2001): el compromiso. **No elimina los falsos
  positivos: los deja en torno a la mitad** (3,5 a 19 %). Es el adoptado.
- **Iterativo con corrección del sesgo de r₁**, $(n\,r_1 + 2)/(n - 4)$: el mejor en la simulación, pero con
  las series reales de 21 a 26 años la iteración se va al tope de r₁. El norte de India en GRACE pasaba de
  p = 7·10⁻⁸ a p = 0,89, y el NDVI del Sahel de 0,0008 a 0,36. **Descartado.**

### 3.3 El método adoptado
`PrewhiteningTrendTest.cs`. Con $x_t$ el valor del año $t$ y $P$ los pares de años consecutivos:

$$r_1(y) = \frac{\sum_{t \in P} (y_t - \bar y)(y_{t+1} - \bar y)}{\sum_{t} (y_t - \bar y)^2} \cdot \frac{n - 1}{|P|}$$

El factor $(n-1)/|P|$ vale 1 sin huecos y compensa los productos que faltan cuando los hay.

1. $c \leftarrow r_1(x)$. Si $c < 0{,}05$, no se toca la serie: el veredicto es el clásico.
2. Blanqueo que conserva la pendiente: $w_t = \dfrac{x_t - c\,x_{t-1}}{1 - c}$, sólo para $t-1, t$ consecutivos.
3. $b \leftarrow$ pendiente de Sen de $w$.
4. $c \leftarrow r_1(x - b\,t)$, medido ya sin la tendencia. Si $c < 0{,}05$, veredicto clásico.
5. Se repiten 2 a 4 hasta que $c$ y $b$ cambian menos de $10^{-4}$ (máximo 50 vueltas; $c$ se limita a 0,95).
6. Mann-Kendall sobre $w$.

Con menos de 8 años o menos de 5 pares consecutivos no se calcula. Una recta exacta o una serie constante
dejan residuos nulos: se da el veredicto clásico.

**Comprobado:**
- No hay una implementación de terceros en Python (la de referencia es el paquete `zyp` de R, que no está
  instalado aquí). Se contrasta con un prototipo aparte en numpy: coinciden a 6 decimales r₁ y Z en seis
  series, una real y una con hueco. El valor p coincide con error absoluto menor que $10^{-6}$.
- El Mann-Kendall y la pendiente de Sen de ese prototipo se comprueban contra `pymannkendall` 1.4.3 y SciPy.
- Lo que respalda el método es **la simulación** de 3.2, no la comparación de decimales.

---

## 4. Comparaciones múltiples
`BenjaminiHochberg.cs`. Con $m$ celdas y los valores p ordenados $p_{(1)} \le \dots \le p_{(m)}$:

$$q_{(i)} = \min_{j \ge i} \; \frac{m}{j}\, p_{(j)}$$

Una celda se marca como sostenida si $q \le 0{,}05$: de las marcadas, se espera que como mucho el 5 % sea
un falso hallazgo (Benjamini y Hochberg, 1995).

- Se aplica sobre los p **con preblanqueo**, no sobre los clásicos: el ajuste sólo vale si cada p es fiable.
- **Comprobado:** coincide a 9 decimales con `scipy.stats.false_discovery_control(p, method="bh")` en 14
  valores, donde 8 hallazgos sin corregir pasan a 3. Con mil valores p repartidos por igual entre 0 y 1
  (nada cambia) pasan 50 sin corregir y 0 corregidos.

---

## 5. Efecto medido

Celdas con tendencia significativa, sobre todo el periodo de cada fuente:

| Variable | Celdas | Sin corregir | Sin persistencia | + FDR 5 % | Suben | Bajan |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| GISTEMP, 2000–2026 | 16.021 | 9.843 | 8.449 | 7.117 | 7.117 | 0 |
| Temperatura del aire MERRA-2, 1981–2025 | 16.200 | 12.043 | 11.176 | 10.727 | 9.952 | 775 |
| Precipitación MERRA-2, 1981–2025 | 16.200 | 5.622 | 4.911 | 2.812 | 1.697 | 1.115 |
| Precipitación GPM IMERG, 1998–2025 | 16.200 | 4.667 | 4.070 | 2.297 | 2.065 | 231 |
| Evaporación en tierra MERRA-2, 1981–2025 | 4.573 | 1.764 | 1.465 | 941 | 645 | 296 |
| Humedad del suelo MERRA-2, 1981–2025 | 4.573 | 1.891 | 1.293 | 737 | 502 | 235 |
| NDVI MODIS, 2000–2025 | 3.094 | 1.287 | 1.211 | 894 | 830 | 64 |
| GRACE, agua y hielo, 2002–2025 | 5.832 | 4.358 | 3.684 | 3.517 | 1.805 | 1.712 |
| CO₂ OCO-2, 2015–2025 | 3.139 | 3.139 | 3.138 | 3.138 | 3.138 | 0 |

Donde la señal es fuerte (temperatura, hielo, CO₂) casi no cambia. Donde es débil y ruidosa
(precipitación, humedad del suelo), la mitad de las celdas "significativas" no aguanta.

**Los ocho casos del tablero aguantan:**

| Variable | Centro-oeste de Brasil: p clásico → corregido | Bangladés: p clásico → corregido |
| :--- | :--- | :--- |
| Temperatura del aire | 7,3e-14 → 3,3e-09 | 5,8e-03 → **1,5e-02** |
| Precipitación | 7,6e-10 → 4,7e-09 | 9,8e-10 → 1,9e-05 |
| Humedad del suelo | 1,8e-12 → 3,0e-10 | 2,8e-10 → 4,5e-08 |
| Evaporación en tierra | 2,3e-10 → 5,0e-08 | 2,0e-08 → 1,4e-07 |

El más justo es la temperatura de Bangladés (p = 0,015). **La lluvia de MERRA-2 en la Amazonía no
aguanta:** r₁ = 0,30 y p = 0,091.

---

## 6. Cómo se ve en la aplicación

- **Tarjeta de una celda:** fila nueva "Persistencia entre años · Mann-Kendall con preblanqueo" con r₁, el
  valor p corregido y si la tendencia sigue siendo significativa. La pregunta final pasa a ser "¿Se
  sostiene el veredicto?". Si la tendencia no supera la corrección, la insignia dice "Tendencia sin
  confirmar" en vez de "Aumento sostenido" o "Descenso sostenido".
- **Lectura "Tendencia (Sen)":** bajo el número de celdas, los tres recuentos de la sección 5. Al elegir
  una celda: "Tendencia sólida", "Significativa sin corregir, pero no supera las correcciones" o "No se
  distingue del azar", con su valor p o q.
- **Tablero de casos:** el valor p que enseña ya es el corregido, y sólo dice "Sube" o "Baja" si lo supera.

## 7. API

- `GET /api/trends` añade `prewhitened`: `lag1Autocorrelation`, `sampleSize`, `zScore`, `pValue`,
  `isSignificant`. `sampleSize = 0` significa que no se pudo calcular.
- `GET /api/trends/grid` añade por celda `prewhitenedPValue`, `adjustedPValue` (el valor q) e
  `isSignificantCorrected`; y en la respuesta `falseDiscoveryRate`, `significantCells`,
  `prewhitenedSignificantCells` y `correctedSignificantCells`.
- `isSignificant` y `pValue` no cambian de significado: siguen siendo el test clásico.
- OCO-2 pasa a ser una variable de cadencia anual (`VariableCadence`), como MERRA-2.
- El rango válido de GRACE se amplió a ±2.000 cm: el mínimo real es −967.

**Memoria:** carga completa desde cero con los límites del contenedor (256 MB de DuckDB, 2 hilos) y los
nueve datasets: pico de **651 MB** (652 antes de añadir estos dos), 20,2 s, base de 260 MB. **Sigue sin
probarse en Render.**

**Tests:** 194 de 194, `dotnet build -warnaserror` sin avisos. Los 14 nuevos están en
`SignificanceCorrectionsTests.cs`.

---

## 8. Puntos abiertos para tu criterio

1. **El preblanqueo iterativo no lleva los falsos positivos al 5 %.** Con persistencia fuerte quedan en
   15–19 %. ¿Basta con enseñarlo junto al clásico, o prefieres un método más estricto a costa de potencia?
2. **Umbrales propios, no citados:** no blanquear si r₁ < 0,05; tope de r₁ en 0,95; convergencia en 10⁻⁴;
   mínimo de 8 años. El 0,05 es el que recuerdo de la implementación de `zyp` (no lo he vuelto a
   comprobar en su código); el resto son decisiones del proyecto.
3. **La curvatura infla r₁.** r₁ se mide sobre los residuos de una recta. Si la tendencia real se acelera,
   esos residuos parecen persistentes y la corrección sale más severa de lo debido.
4. **Benjamini-Hochberg con celdas vecinas correlacionadas.** El procedimiento es válido con dependencia
   positiva, que es lo esperable en un campo climático. Wilks (2016) propone para campos muy
   correlacionados una tasa del doble del nivel global: conviene que lo revises.
5. **La prueba t de la regresión no se corrige** por autocorrelación: sigue siendo la clásica.
6. **GRACE.** El año es la media de los meses disponibles (9 a 12): en 2013–2016 faltan tres, y con ciclo
   estacional eso sesga la media anual. La corrección de rebote posglacial (ICE-6G_D) va dentro del
   producto y afecta a Canadá, Escandinavia y la Antártida. La resolución real de GRACE es de unos 300 km:
   una celda de 2° no es independiente de sus vecinas.
7. **CO₂.** Media de medias mensuales con 6 meses o más: los meses que faltan no son los mismos en cada
   celda. Es XCO₂, no concentración en superficie. Los sondeos que se leen son una muestra de los del
   producto (la imagen a 0,07°), no todos.
8. **El índice de divergencia** de `OpposingTrendsService` sigue usando el Z clásico.
9. **El valor p de Mann-Kendall** usa una aproximación a la normal con error del orden de 10⁻⁷. No
   afecta a ningún veredicto, pero por eso los tests comparan p con tolerancia absoluta.

---

## 9. Cómo reproducir

```bash
# GRACE (pip install numpy)
python scripts/etl/gsfc_mascons_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/grace_mascons.csv --variable GraceMass --output grace_mascons.parquet

# CO2 de OCO-2 (pip install numpy pillow): descarga 255 MB en unos 50 minutos la primera vez
python scripts/etl/gibs_oco2_to_csv.py
dotnet run --project backend/tools/NasaTrendDetective.EtlCli -- normalize --source data/nasa/raw/oco2_xco2.csv --variable Oco2 --output oco2_xco2.parquet
```

Con la API en local:

```
GET http://localhost:5000/api/trends?variable=GraceMass&startYear=2002&endYear=2025&latitude=29&longitude=77
GET http://localhost:5000/api/trends/grid?variable=Oco2&startYear=2015&endYear=2025
```

## Referencias

- Zhang, X., Vincent, L. A., Hogg, W. D., Niitsoo, A. (2000). *Temperature and precipitation trends in Canada during the 20th century.* Atmosphere-Ocean 38.
- Wang, X. L., Swail, V. R. (2001). *Changes of extreme wave heights in Northern Hemisphere oceans and related atmospheric circulation regimes.* J. Climate 14.
- von Storch, H. (1995). *Misuses of statistical analysis in climate research.* En *Analysis of Climate Variability*, Springer.
- Yue, S., Pilon, P., Phinney, B., Cavadias, G. (2002). *The influence of autocorrelation on the ability to detect trend in hydrological series.* Hydrol. Process. 16.
- Hamed, K. H., Rao, A. R. (1998). *A modified Mann-Kendall trend test for autocorrelated data.* J. Hydrol. 204.
- Yue, S., Wang, C. Y. (2004). *The Mann-Kendall test modified by effective sample size to detect trend in serially correlated hydrological series.* Water Resour. Manag. 18.
- Benjamini, Y., Hochberg, Y. (1995). *Controlling the false discovery rate: a practical and powerful approach to multiple testing.* J. R. Stat. Soc. B 57.
- Wilks, D. S. (2016). *"The stippling shows statistically significant grid points": how research results are routinely overstated and overinterpreted, and what to do about it.* Bull. Amer. Meteor. Soc. 97.
- Loomis, B. D., Luthcke, S. B., Sabaka, T. J. (2019). *Regularization and error characterization of GRACE mascons.* J. Geod. 93, doi:10.1007/s00190-019-01252-y.
- OCO-2: *OCO-2 Level 2 bias-corrected XCO2 and other select fields from the full-physics retrieval aggregated as daily files, Retrospective processing V11.2r (OCO2_L2_Lite_FP).* NASA GES DISC. Título y versión tal como los declaran los metadatos de la capa de GIBS.

La fórmula del sesgo de r₁ del método descartado, $(n\,r_1 + 2)/(n - 4)$, es la que se usa en la literatura de
preblanqueo para series sin tendencia; **no he comprobado la cita exacta**, así que no la atribuyo.
