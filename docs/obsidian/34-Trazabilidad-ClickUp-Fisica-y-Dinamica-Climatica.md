# 📋 Trazabilidad en ClickUp — Módulo de Física Terrestre, Radiación y Teleconexiones

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Física Climatica, Dinamica Atmosferica y Teleconexiones` (Pendiente creación / importación)
- **Asignada:** `Por Asignar (Nueva Integrante - Especialista en Física | Pendiente confirmación de correo)`
- **Supervisión & Vinculación:** Johan Sebastian Olaya (Data Science) & Brayan Stid Cortés (Frontend Lead)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[05-Rigor-Cientifico-MannKendall]], [[24-Implementacion-Motor-Cientifico-y-Api]]

---

## 🎯 Objetivo del Módulo de Física

Proporcionar solidez y validación biofísica irrefutable a las tendencias detectadas por la plataforma, garantizando que los arcos de teleconexión espacial, las anomalías de masa gravitacional de GRACE-FO, el forzamiento radiativo de gases de efecto invernadero (OCO-2) y las correcciones de autocorrelación serial en Mann-Kendall cumplan con las leyes fundamentales de conservación de energía y masa del sistema climático terrestre.

---

## 📊 Matriz General de Tareas en ClickUp para la Especialista en Física

| Código | Tarea Principal | Estimación | Prioridad | Estado | Enfoque Físico |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **[PHYS-T1]** | Validación física de teleconexiones climáticas y arcos 3D | 8h | Alta (2) 🟠 | `to do` ⚪ | Consistencia de correlaciones remotas ENSO, NAO, IOD y dipolo del Océano Índico. |
| **[PHYS-T2]** | Modelado de masa de agua equivalente y gravedad (GRACE/GRACE-FO) | 10h | Alta (2) 🟠 | `to do` ⚪ | Conversión geofísica de coeficientes armónicos esféricos a espesor equivalente de agua (EWH en cm). |
| **[PHYS-T3]** | Forzamiento radiativo y balance térmico ($CO_2$ OCO-2 vs. GISTEMP) | 8h | Normal (3) 🔵 | `to do` ⚪ | Cálculo del forzamiento radiativo instantáneo $\Delta F = 5.35 \ln(C/C_0) \text{ W/m}^2$. |
| **[PHYS-T4]** | Pre-blanqueamiento físico de autocorrelación lag-1 en Mann-Kendall | 6h | Alta (2) 🟠 | `to do` ⚪ | Mitigación del falso positivo en series temporales geofísicas con persistencia roja (método Yue-Pilon). |
| **[PHYS-T5]** | Auditoría y ficha técnica de consistencia termodinámica global | 6h | Normal (3) 🔵 | `to do` ⚪ | Documento de rigor físico para el jurado NASA validando conservación de energía superficial. |

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
* **Descripción:** Los datos geofísicos y climáticos presentan inercia térmica y memoria de estado (autocorrelación serial $\rho_1 > 0$), lo que infla artificialmente la significancia estadística del test de Mann-Kendall. Implementar o validar el filtro de pre-blanqueamiento (*Trend-Free Pre-Whitening* - TFPW).
* **Prioridad:** Alta (2) 🟠
* **Subtareas:**
  - **PHYS-T4.1:** Formular el cálculo del coeficiente de autocorrelación lag-1 $r_1 = \frac{\sum (x_t - \bar{x})(x_{t+1} - \bar{x})}{\sum (x_t - \bar{x})^2}$.
  - **PHYS-T4.2:** Definir el protocolo Yue-Pilon (1998): sustracción de pendiente de Sen preliminar, filtrado autorregresivo $y'_t = y_t - r_1 y_{t-1}$, y reincorporación de la pendiente real.
  - **PHYS-T4.3:** Contrastar los p-valores antes y después del pre-whitening para descartar falsas tendencias inducidas por ruido rojo.
* **Criterio de Aceptación:** Algoritmo documentado y probado con series sintéticas y reales de GISTEMP con $\rho_1 > 0.2$.

---

### 📜 [PHYS-T5] Auditoría y ficha técnica de consistencia termodinámica global
* **Descripción:** Elaborar la memoria técnica física del proyecto para el dossier del jurado de la NASA, explicando cómo cada capa visual respeta los principios de termodinámica, conservación de flujo y transporte radiativo.
* **Prioridad:** Normal (3) 🔵
* **Subtareas:**
  - **PHYS-T5.1:** Redactar el anexo de Física del Clima para el repositorio y la bóveda de Obsidian.
  - **PHYS-T5.2:** Revisar la coherencia de unidades de medida en toda la interfaz (Kelvin/Celsius, ppm, EWH cm, NDVI adimensional $[-0.2, 1.0]$).
  - **PHYS-T5.3:** Validar que los textos del Wizard de 3 pasos reflejen precisión conceptual (evitar términos coloquiales que desvirtúen la física de sensores remotos).
* **Criterio de Aceptación:** Documento final aprobado e integrado en `docs/obsidian/` listo para adjuntar en la postulación oficial.
