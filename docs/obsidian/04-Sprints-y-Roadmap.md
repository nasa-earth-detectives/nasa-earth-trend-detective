# 📅 Sprints y Roadmap de Trabajo

Volver al [[00-Map-Of-Content]] | Ver roles en [[03-Roles-y-Equipo]] | Trazabilidad: [[11-Trazabilidad-ClickUp-Sprint-1|S1]] • [[15-Trazabilidad-ClickUp-Sprint-2|S2]] • [[18-Trazabilidad-ClickUp-Sprint-3|S3]] • [[19-Trazabilidad-ClickUp-Sprint-4|S4]]

---

## 🛡️ Protocolo y Franja Laboral Protegida (Anti-Riesgo Laboral)

> [!CAUTION]
> **Franja Laboral Primaria (Empleo Formal del Equipo):**
> Los integrantes del equipo tienen sus contratos y jornadas laborales activas de:
> - **Lunes a Viernes:** 07:00 am a 05:00 pm (17:00).
> - **Sábados:** 07:00 am a 12:00 pm (12:00 m — medio día).
> 
> **Queda terminantemente prohibido** desarrollar, commitear o realizar entregas del proyecto NASA durante dicha franja para salvaguardar la estabilidad laboral del equipo.

### ⏰ Ventanas Oficiales de Desarrollo para el Hackathon NASA
1. **Lunes a Viernes (Noches):** 05:00 pm a 10:00 pm (17:00 - 22:00) — *5 horas disponibles/persona*.
2. **Sábados (Tarde/Noche):** 12:00 pm a 10:00 pm (12:00 - 22:00) — *10 horas disponibles/persona*.
3. **Domingos (Jornada Libre Hackathon):** 08:00 am a 10:00 pm (08:00 - 22:00) — *14 horas disponibles/persona*.
4. **Deadline Internacional NASA:** Domingo 04 de Octubre de 2026 a las 08:00 pm (20:00).

---

## 🏃 Cronograma Oficial de los 4 Sprints en ClickUp

El proyecto comprende **86 tareas y subtareas** atómicas y desacopladas en ClickUp:

```
[Sprint 1: Fundaciones & ETL] ──────► [Sprint 2: Motor Científico] ──────► [Sprint 3: Experiencia 3D] ──────► [Sprint 4: Pitch & Cierre NASA]
Lun 21 Sep 17:00 - Mar 22 Sep 22:00   Mié 23 Sep 17:00 - Vie 25 Sep 21:00   Sáb 26 Sep 12:00 - Mar 29 Sep 21:00   Mié 30 Sep 17:00 - Dom 04 Oct 20:00
```

---

### 🔹 Sprint 1: Datos, ETL y Arquitectura Base
*Ventana: Lunes 21 Sep 17:00 al Martes 22 Sep 22:00 (Cierre de fase fundacional)*

- **[S1-T0] Despliegue en la Nube, CI/CD y Gobernanza** (10h) ➔ **Todo el Equipo** `[COMPLETE 🟢]`
  - Subtareas: S1-T0.1 (Vercel Edge), S1-T0.2 (Render Backend), S1-T0.3 (Rulesets v2), S1-T0.4 (CODEOWNERS & Equipos), S1-T0.5 (Dashboard README)
- **[S1-T1] Solución .NET 10 Clean Architecture y Middlewares** (6h) ➔ **July (Daniela)**
  - Subtareas: S1-T1.1 (Sln modular), S1-T1.2 (Swagger estricto), S1-T1.3 (ProblemDetails RFC 7807)
  - Horario: Lun 21 Sep 17:00 ➔ Mar 22 Sep 21:00
- **[S1-T2] Extractores Datasets Satelitales NASA** (8h) ➔ **Fabriany (Reving)**
  - Subtareas: S1-T2.1 (EarthData Client), S1-T2.2 (Normalizador Grilla), S1-T2.3 (Limpieza Nulos)
  - Horario: Lun 21 Sep 17:00 ➔ Mar 22 Sep 22:00
- **[S1-T3] Formulación matemática de Mann-Kendall** (6h) ➔ **Johan**
  - Subtareas: S1-T3.1 (Especificación S y Varianza), S1-T3.2 (Series Sintéticas Control), S1-T3.3 (Cálculo Z)
  - Horario: Lun 21 Sep 17:00 ➔ Mar 22 Sep 21:00
- **[S1-T4] Setup inicial React 19 + Globe.gl 3D** (6h) ➔ **Diego**
  - Subtareas: S1-T4.1 (Vite + Three.js), S1-T4.2 (Textura Blue Marble), S1-T4.3 (OrbitControls 60 FPS)
  - Horario: Lun 21 Sep 17:00 ➔ Mar 22 Sep 21:00
- **[S1-T5] Design System espacial Glassmorphism** (5h) ➔ **Brayan**
  - Subtareas: S1-T5.1 (Tokens Tailwind), S1-T5.2 (Clases Blur 16px), S1-T5.3 (Navbar Espacial)
  - Horario: Lun 21 Sep 17:00 ➔ Mar 22 Sep 21:00

---

### 🔹 Sprint 2: Motor Científico y Pipeline Analítico
*Ventana: Miércoles 23 Sep 17:00 al Viernes 25 Sep 21:00*

- **[S2-T1] Endpoints REST y DTOs Tipados** (8h) ➔ **July (Daniela)**
  - Subtareas: S2-T1.1 (DTOs geoespaciales), S2-T1.2 (TrendsController & FluentValidation), S2-T1.3 (Application Services)
  - Horario: Mié 23 Sep 17:00 ➔ Vie 25 Sep 21:00
- **[S2-T2] Almacén Columnar DuckDB Embebido** (8h) ➔ **Fabriany (Reving)**
  - Subtareas: S2-T2.1 (DuckDB .NET Driver), S2-T2.2 (Esquemas hechos/dimensiones), S2-T2.3 (Importador Parquet)
  - Horario: Mié 23 Sep 17:00 ➔ Vie 25 Sep 21:00
- **[S2-T3] Algoritmo de Mann-Kendall y Sen's Slope** (8h) ➔ **Johan**
  - Subtareas: S2-T3.1 (MannKendallCalculator), S2-T3.2 (SensSlopeEstimator), S2-T3.3 (Veredictos científicos)
  - Horario: Mié 23 Sep 17:00 ➔ Vie 25 Sep 21:00
- **[S2-T4] Hexágonos 3D y Mapas de Calor Dinámicos** (7h) ➔ **Diego**
  - Subtareas: S2-T4.1 (Hexágonos altitud dinámica), S2-T4.2 (Gradiente térmico anomalías), S2-T4.3 (InstancedMesh 60 FPS)
  - Horario: Mié 23 Sep 17:00 ➔ Vie 25 Sep 21:00
- **[S2-T5] Panel Inspector de Detective Climático** (5h) ➔ **Brayan** `[COMPLETE 🟢]`
  - Subtareas: S2-T5.1 (DetectiveCard Glassmorphism), S2-T5.2 (Badges \|Z\| > 1.96), S2-T5.3 (Gráfico SVG Series)
  - Horario: Mié 23 Sep 17:00 ➔ Jue 24 Sep 21:00

---

### 🔹 Sprint 3: Experiencia 3D, Tendencias Opuestas e Integración
*Ventana: Sábado 26 Sep 12:00 m al Martes 29 Sep 21:00*

- **[S3-T1] Seguridad de API, Rate Limiting y Caché** (6h) ➔ **July (Daniela)**
  - Subtareas: S3-T1.1 (Rate Limiting IP), S3-T1.2 (Caché en memoria), S3-T1.3 (Middleware User-Agent / Bots)
  - Horario: Sáb 26 Sep 12:00 ➔ Lun 28 Sep 21:00
- **[S3-T2] Optimización de Consultas DuckDB <50ms** (6h) ➔ **Fabriany (Reving)**
  - Subtareas: S3-T2.1 (Vistas SQL agregadas), S3-T2.2 (Índices y orden columnar), S3-T2.3 (Benchmark <50ms)
  - Horario: Sáb 26 Sep 12:00 ➔ Lun 28 Sep 21:00
- **[S3-T3] Motor de Tendencias Opuestas (Opposing Trends)** (8h) ➔ **Johan**
  - Subtareas: S3-T3.1 (Divergencia regional), S3-T3.2 (Casos emblemáticos NASA), S3-T3.3 (OpposingTrendsService C#)
  - Horario: Sáb 26 Sep 12:00 ➔ Mar 29 Sep 21:00
- **[S3-T4] Anillos Pulsantes (Ripples) y Arcos 3D** (7h) ➔ **Diego**
  - Subtareas: S3-T4.1 (Ripples en hotspots), S3-T4.2 (Arcos teleconexión), S3-T4.3 (Animaciones 60 FPS)
  - Horario: Sáb 26 Sep 12:00 ➔ Mar 29 Sep 21:00
- **[S3-T5] Time-Slider Interactivo 2000-2026** (6h) ➔ **Brayan** `[COMPLETE 🟢]`
  - Subtareas: S3-T5.1 (Marcas 2000-2026), S3-T5.2 (Playback 1x/2x/5x), S3-T5.3 (Sincronización 3D)
  - Horario: Dom 27 Sep 09:00 ➔ Lun 28 Sep 21:00

---

### 🔹 Sprint 4: Rigor Científico, Ajustes Hackathon Neiva, Seeders y Cierre NASA
*Ventana de ejecución extendida: Hackathon Neiva — Sábado 14 y Domingo 15 de noviembre de 2026 (Cierre oficial: Dom 15 Nov 11:59 p. m.)*

- **[S4-T1] Pruebas de Integración API y Swagger** (5h) ➔ **July (Daniela)** `[complete 🟢]`
  - Subtareas: S4-T1.1 (WebApplicationFactory), S4-T1.2 (Swagger schemas), S4-T1.3 (Contratos HTTP)
- **[S4-T2] Integración de datos reales abiertos (AppEEARS, Giovanni, Hydrology, NOAA CDO, CSA SWOT) y Seeders DuckDB** (6h) ➔ **Fabriany (Reving)** `[to do ⚪]`
  - Subtareas: S4-T2.1 (Muestras reales AppEEARS/Giovanni/Hydrology/SWOT), S4-T2.2 (DuckDB offline), S4-T2.3 (Test sin conexión)
- **[S4-T3] Validación Estadística Cruzada vs NASA** (6h) ➔ **Johan** `[complete 🟢]`
  - Subtareas: S4-T3.1 (Validación Ártico GISTEMP), S4-T3.2 (Masa hielo GRACE-FO), S4-T3.3 (Anexo jurado)
- **[S4-T4] Ajustes UI Frontend (fuentes NASA/CSA, responsivo), WebGL 60 FPS y capturas demo** (6h) ➔ **Diego** `[desarrollando 🟡]`
  - Subtareas: S4-T4.1 (Ajustes responsivos/fuentes `[desarrollando]`), S4-T4.2 (Anti-leaks y 60 FPS), S4-T4.3 (Capturas 1080p para 7 slides)
- **[S4-T5] Guion, Presentación Oficial (máx. 7 diapositivas EN — Opción A) y Envío NASA** (8h) ➔ **Brayan** `[to do ⚪]`
  - Subtareas: S4-T5.1 (Textos EN + equipo de 6), S4-T5.2 (Presentación 7 slides en inglés + enlace público), S4-T5.3 (Submit for Judging)
- **[S4-T6] Validación Cruzada KNMI Climate Explorer y Metodología SeaWiFS (NTRS 20090042747)** (4h) ➔ **Johan** `[to do ⚪]`
  - Subtareas: S4-T6.1 (Contraste KNMI), S4-T6.2 (Ficha SeaWiFS), S4-T6.3 (Pre-blanqueamiento lag-1 con Emilse)
- **[S4-T7] Exposición de Metadatos NASA/CSA/KNMI y Ajuste de Catálogo en API .NET 10** (4h) ➔ **July (Daniela)** `[to do ⚪]`
  - Subtareas: S4-T7.1 (`NasaDatasetCatalog` + DTOs), S4-T7.2 (Compatibilidad DuckDB/Render 256 MB), S4-T7.3 (Smoke tests Render/Swagger)
- **[PHYS-T1..T5] Módulo Paralelo de Física Climática y QA Científico (38h)** ➔ **Emilse Cabrera** `[to do ⚪ — Revisión activa de fuentes]`
  - Ver detalle en [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]] y cronograma hora a hora en [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]].

---

## 🔗 Enlaces Relacionados
- [[05-Rigor-Cientifico-MannKendall]]
- [[06-Pipeline-CI-CD]]
- [[17-Time-Slider-Interactivo-y-Control-Multivelocidad]]
- [[19-Trazabilidad-ClickUp-Sprint-4]]
- [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]]
- [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]]
