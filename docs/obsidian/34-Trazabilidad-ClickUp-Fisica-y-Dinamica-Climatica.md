# 📋 Trazabilidad en ClickUp — Módulo de Física Terrestre, Radiación y Teleconexiones

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Física Climática, Dinámica Atmosférica y Teleconexiones` (ID: `1600500000000664`)
- **Asignada:** `Emilse Cabrera` (`emilse.cabrera.c@gmail.com` | ClickUp ID: `252219659`) — Especialista en Física Climática y Testing Científico
- **Supervisión & Vinculación:** Johan Sebastian Olaya (Data Science) & Brayan Stid Cortés (Frontend Lead)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[05-Rigor-Cientifico-MannKendall]], [[24-Implementacion-Motor-Cientifico-y-Api]], [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]]

---

## 🎯 Objetivo del Módulo de Física

Proporcionar solidez y validación biofísica irrefutable a las tendencias detectadas por la plataforma, separando de forma transparente las fórmulas **ya integradas en el código actual** de las extensiones físicas **propuestas para validación o ajuste** durante el Hackathon Neiva (14–15 nov 2026).

---

## 📐 Inventario Verificado de Fórmulas Integradas en el Proyecto (Estado Real del Código)

> **Actualización verificada del 2026-11-14 (`development` + PR #75 + PR #77):**
> - **9 de 9 variables** ya operan con datos reales observados en Parquet (`backend/seed/`, incluyendo **GRACE/GRACE-FO** mascons GSFC `RL06v2.0` y **OCO-2 XCO₂** GIBS `V11.2r`), sin fallbacks sintéticos ni series de referencia lineales en `OpposingTrendsService`.
> - El backend ya ejecuta **preblanqueamiento iterativo lag-1** (`PrewhiteningTrendTest`, Zhang 2000 / Wang & Swail 2001 — elegido mediante simulación AR(1) frente a TFPW), **control FDR Benjamini-Hochberg al 5 %** (`BenjaminiHochberg`) y **prueba t de regresión lineal** (`LinearTrendTest`), además de pruebas automáticas `2000–2025` sobre datos locales y APIs vivas de la NASA (`PR #77`).
> - La interfaz está 100 % en **inglés** (`PR #75`). Detalles y puntos abiertos para revisión final de física en [[39-Formulas-y-Supuestos-para-QA-Fisico]] y [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]].

Todas estas ecuaciones están sincronizadas dentro de las tarjetas `[PHYS-T1]` a `[PHYS-T5]` en ClickUp y en GitHub Issues `#66`–`#70`:

1. **Núcleo Estadístico en C# (`backend/src/NasaTrendDetective.Application/Statistics/`):**
   - **Mann-Kendall (`MannKendallCalculator.cs`):** $S = \sum_{k < j} \operatorname{sgn}(x_j - x_k)$ con umbral de empate $|x_j - x_k| \le 10^{-7}$ ($n \ge 3$); $\operatorname{Var}(S) = \frac{n(n-1)(2n+5) - \sum t_i(t_i-1)(2t_i+5)}{18}$ (redondeo a 6 decimales); estandarización $Z = \frac{S \mp 1}{\sqrt{\operatorname{Var}(S)}}$ y criterio bilateral $|Z| > 1.95996398454$ ($p < 0.05$).
   - **Preblanqueamiento Iterativo lag-1 (`PrewhiteningTrendTest.cs`) + FDR (`BenjaminiHochberg.cs`) + Prueba t (`LinearTrendTest.cs`):** corrección iterativa contra persistencia serial $r_1$ con ajuste $(n-1)/|P|$ y control de falsos descubrimientos al 5 % en grilla.
   - **Normal Estándar (`NormalDistribution.cs`):** aproximación de **Abramowitz & Stegun** (error $< 1.5 \times 10^{-7}$): $t = \frac{1}{1 + 0.2316419 |z|}$, $\Phi(|z|) = 1 - \frac{1}{\sqrt{2\pi}} e^{-z^2/2}\sum_{m=1}^{5} B_m t^m$, $p = 2(1 - \Phi(|z|))$ ($0.0$ si $|z| \ge 8.0$).
   - **Pendiente de Sen (`SensSlopeEstimator.cs`):** mediana de $Q_{kj} = \frac{x_j - x_k}{t_j - t_k}$ ($\Delta t \ne 0$, $n \ge 2$), `SlopePerDecade = medianSlope * 10`, e IC 95 % con $C_\alpha = Z_{0.975}\sqrt{\operatorname{Var}(S)}$ en índices $\lfloor(N \mp C_\alpha)/2\rfloor$ *(con ajuste de rango índice superior corregido frente a SciPy)*.
2. **Teleconexiones y Geometría Geodésica (`OpposingTrendsService.cs`, `OpposingPairCatalog.cs`, `teleconnectionService.ts`, `observationLookup.ts`):**
   - **4 pares dinámicos reales MERRA-2 (`1981–2025`):** Centro-Oeste de Brasil vs. Bangladés, Gansu vs. Sureste de Brasil y Lejano Oriente Ruso vs. Ontario/Quebec, evaluados con `DivergenceIndex = |Z_inc - Z_dec| · (1 + |SensSlope_inc - SensSlope_dec|)` y verificados tras preblanqueo. *(Pendiente revisar con Física el uso del $Z$ clásico frente al preblanqueado en `DivergenceIndex` — Nota 40 §8.8).*
   - **Arcos 3D y Haversine:** $\delta = \arccos(\sin\phi_1\sin\phi_2 + \cos\phi_1\cos\phi_2\cos(\lambda_2-\lambda_1))$, altitud $= 0.12 + 0.13\,\delta$; Haversine en grados con soporte $< 4^\circ$.
3. **ETL DuckDB, Mascons GRACE, OCO-2, Calor 3D y Mecánica Orbital (`CanonicalGridSql.cs`, `DataCleaningSql.cs`, `GridTrendService.cs`, `earthHeatRaster.ts`, `solarPosition.ts`, `lunarPosition.ts`, `satelliteMissions.ts`):**
   - **WGS84 e imputación lineal ETL:** envoltura longitudinal a $[-180, 180)$ (`DECIMAL(5,2)`), fill values `[-9999, 9999]` y relleno lineal únicamente para huecos de **1 periodo** ($\Delta t \le 2.5\,\Delta t_{\text{min}}$); grilla con `MinMonthsPerYear = 9` y `MinYearsPerCell = 10` (mascons GRACE GSFC `RL06v2.0` regrillados por área de solape; rango validado `±2,000 cm EWH`).
   - **Mapa de calor esférico y aclareo polar:** kernel cuadrático $w_i = \left(\frac{\cos\theta_i - \cos 4^\circ}{1 - \cos 4^\circ}\right)^2$ y aclareo `round(1 / max(cos φ, 1e-6))`.
   - **Astronomía y órbitas:** posición subsolar USNO (1800–2200), serie lunar analítica y parámetros nominales de Terra, Aqua, OCO-2 (`705 km`, `98.2°`) y GRACE-FO (`490 km`, `89°`) *(etiquetadas como órbitas ilustrativas aceleradas en UI)*.
4. **Pendiente de decisión / revisión física final de Emilse (ver Nota 40 §8):** rezagos `lag 1–6` dinámicos, conversión externa/sesgo estacional GRACE 2013–2016 + hueco 2017–2018 + GIA ICE-6G_D, si el forzamiento radiativo $\Delta F = 5.35 \ln(C/C_0)$ requiere cálculo en UI/API o queda como marco documental, umbrales (`|r1| < 0.05`, tope `0.95`) y correlación espacial vecina (Wilks, 2016).

---

## 📊 Matriz General de Tareas en ClickUp para la Especialista en Física

> *Nota operativa:* La lista `PhysicsModule` en ClickUp solo dispone de los estados `to do` y `complete`, por lo que permanecen en `to do ⚪` con sus descripciones actualizadas hasta que Emilse cierre el aval final; en **GitHub Project #1**, `#66`–`#69` (`PHYS-T1..T4`) ya figuran en **`Review`** y `#70` (`PHYS-T5`) en **`In Progress`**.

| Código | Tarea Principal | Estimación | Prioridad | Estado ClickUp / GitHub | ClickUp Task | Enfoque Físico & Testing |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **[PHYS-T1]** | Validación y testing físico de teleconexiones climáticas y arcos 3D | 8h | Alta (2) 🟠 | `to do ⚪` / `Review` | [`1dfmnrzd7ug`](https://app.clickup.com/t/1dfmnrzd7ug) | Pares dinámicos reales MERRA-2 listos; revisar `DivergenceIndex` y lag temporal (`#66`). |
| **[PHYS-T2]** | Testing de modelado de masa de agua equivalente y gravedad (GRACE/GRACE-FO) | 10h | Alta (2) 🟠 | `to do ⚪` / `Review` | [`1dfmnrzd7um`](https://app.clickup.com/t/1dfmnrzd7um) | Mascons reales `RL06v2.0` (`2002–2025`) integrados; revisar Nota 40 §8.6 (`#67`). |
| **[PHYS-T3]** | Testing de forzamiento radiativo y balance térmico ($CO_2$ OCO-2 vs. GISTEMP) | 8h | Normal (3) 🔵 | `to do ⚪` / `Review` | [`1dfmnrzd7ur`](https://app.clickup.com/t/1dfmnrzd7ur) | OCO-2 `V11.2r` (`2015–2025`) + GISTEMP real + API viva GISS en CI (`#68`). |
| **[PHYS-T4]** | Testing de pre-blanqueamiento físico de autocorrelación lag-1 en Mann-Kendall | 6h | Alta (2) 🟠 | `to do ⚪` / `Review` | [`1dfmnrzd7uw`](https://app.clickup.com/t/1dfmnrzd7uw) | Preblanqueo iterativo, BH FDR y tests `2000–2025` integrados; revisar §8.1–8.5 (`#69`). |
| **[PHYS-T5]** | Auditoría integral y testing de consistencia termodinámica y unidades en UI | 6h | Normal (3) 🔵 | `to do ⚪` / `In Progress` | [`1dfmnrzd7v0`](https://app.clickup.com/t/1dfmnrzd7v0) | UI inglés + unidades verificadas (PR #75, #77); pendiente auditoría en vivo (`#70`). |

---

## 🔬 Especificación Detallada de Tareas y Subtareas

### 🌌 [PHYS-T1] Validación física de teleconexiones climáticas y arcos 3D
* **Descripción:** Asegurar que los arcos atmosféricos trazados en el globo 3D entre regiones con tendencias contrapuestas correspondan a mecanismos dinámicos reales de la atmósfera (ondas de Rossby, celdas de Walker y Hadley), y no a meras correlaciones espurias o coincidencias numéricas.
* **Prioridad:** Alta (2) 🟠
* **Subtareas:**
  - **PHYS-T1.1:** Mapear los índices climáticos globales conocidos (ENSO Niño 3.4, Oscilación del Atlántico Norte - NAO, Dipolo del Océano Índico - IOD, Oscilación Decadal del Pacífico - PDO) contra las celdas de mayor varianza en GISTEMP y MODIS.
  - **PHYS-T1.2:** Validar la velocidad de propagación física y rezago temporal (*lag* de 1 a 6 meses) en los arcos visuales del frontend.
  - **PHYS-T1.3:** Redactar los micro-textos explicativos de física atmosférica para el tooltip de cada arco en el visualizador 3D.
* **Criterio de Aceptación:** Cada arco 3D visible cuenta con una justificación de dinámica de fluidos geofísicos verificada.

---

### 💧 [PHYS-T2] Modelado de masa de agua equivalente y gravedad (GRACE/GRACE-FO)
* **Descripción:** Interpretar físicamente las anomalías del potencial gravitatorio terrestre medidas por los satélites gemelos GRACE y GRACE-FO, validando su traducción a masa de hielo continental derretida (Gt) y cambio en acuíferos subterráneos.
* **Prioridad:** Alta (2) 🟠
* **Subtareas:**
  - **PHYS-T2.1:** Revisar la formulación de altura equivalente de agua ($EWH = \Delta \sigma / \rho_w$) en Groenlandia, Antártida y grandes cuencas hidrográficas (Amazonas, Congo, Ganges).
  - **PHYS-T2.2:** Validar la tasa de pérdida de masa polar (p. ej. -262 Gt/año en Groenlandia) contra los reportes oficiales del JPL (Jet Propulsion Laboratory).
  - **PHYS-T2.3:** Integrar el umbral de filtrado de ruido gaussiano/destriping característico de los armónicos esféricos GRACE.
* **Criterio de Aceptación:** Coherencia física demostrada entre las tasas calculadas por el backend y la literatura geofísica de la NASA.

---

### ☀️ [PHYS-T3] Forzamiento radiativo y balance térmico ($CO_2$ OCO-2 vs. GISTEMP)
* **Descripción:** Establecer la relación física directa entre el incremento de la fracción molar de dióxido de carbono en columna ($XCO_2$ en ppm) medido por OCO-2 y la anomalía de temperatura superficial de GISTEMP.
* **Prioridad:** Normal (3) 🔵
* **Subtareas:**
  - **PHYS-T3.1:** Aplicar la fórmula empírica de Myhre et al. para forzamiento radiativo: $\Delta F = \alpha \cdot \ln(C / C_0)$, donde $\alpha \approx 5.35 \text{ W/m}^2$ y $C_0 \approx 280\text{ ppm}$.
  - **PHYS-T3.2:** Calcular la respuesta climática en equilibrio ($\lambda \approx 0.8 \text{ K/(W/m}^2\text{)}$) para contrastar el calentamiento observado en latitudes polares (amplificación ártica).
  - **PHYS-T3.3:** Crear una tarjeta informativa en el frontend con el balance de energía en $W/m^2$ para la variable OCO-2.
* **Criterio de Aceptación:** El inspector muestra el forzamiento radiativo calculado a partir de la concentración de $CO_2$.

---

### 📉 [PHYS-T4] Pre-blanqueamiento físico de autocorrelación lag-1 en Mann-Kendall
* **Descripción:** Los datos geofísicos y climáticos presentan inercia térmica y memoria de estado (autocorrelación serial $\rho_1 > 0$), lo que infla artificialmente la significancia estadística del test de Mann-Kendall. Evaluar el pre-blanqueamiento iterativo adoptado frente a *Trend-Free Pre-Whitening* (TFPW).
* **Prioridad:** Alta (2) 🟠
* **Subtareas:**
  - **PHYS-T4.1:** Auditar el cálculo del coeficiente de autocorrelación lag-1 $r_1 = \frac{\sum (x_t - \bar{x})(x_{t+1} - \bar{x})}{\sum (x_t - \bar{x})^2}$ y su compensación por huecos.
  - **PHYS-T4.2:** Revisar el benchmark comparativo entre **preblanqueamiento iterativo** (Zhang 2000 / Wang & Swail 2001, adoptado en `PrewhiteningTrendTest.cs`) y TFPW (Yue-Pilon), donde la simulación de 2,000 series AR(1) mostró menor tasa de falsos positivos con el enfoque iterativo.
  - **PHYS-T4.3:** Contrastar los p-valores preblanqueados + FDR Benjamini-Hochberg frente a KNMI Climate Explorer y definir criterios finales de [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]] (§8.1–8.5).
* **Criterio de Aceptación:** Algoritmo documentado y probado con series sintéticas y reales de GISTEMP (`PR #77` + aval final de Física).

---

### 📜 [PHYS-T5] Auditoría y ficha técnica de consistencia termodinámica global
* **Descripción:** Elaborar la memoria técnica física del proyecto para el dossier del jurado de la NASA, explicando cómo cada capa visual respeta los principios de termodinámica, conservación de flujo y transporte radiativo.
* **Prioridad:** Normal (3) 🔵
* **Subtareas:**
  - **PHYS-T5.1:** Redactar el anexo de Física del Clima para el repositorio y la bóveda de Obsidian.
  - **PHYS-T5.2:** Revisar la coherencia de unidades de medida en toda la interfaz (Kelvin/Celsius, ppm, EWH cm, NDVI adimensional $[-0.2, 1.0]$).
  - **PHYS-T5.3:** Validar que los textos del Wizard de 3 pasos reflejen precisión conceptual (evitar términos coloquiales que desvirtúen la física de sensores remotos).
* **Criterio de Aceptación:** Documento final aprobado e integrado en `docs/obsidian/` listo para adjuntar en la postulación oficial.
