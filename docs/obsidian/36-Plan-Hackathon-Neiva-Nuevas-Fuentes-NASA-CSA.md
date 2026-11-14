# Plan de Ejecución Hackathon Neiva (14–15 Noviembre 2026) y Nuevas Fuentes NASA / CSA

Volver al [[00-Map-Of-Content]] | Trazabilidad Sprint 4: [[19-Trazabilidad-ClickUp-Sprint-4]] | Física: [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]] | Dossier Oficial (EN): [[35-NASA-Space-Apps-Official-Submission-En]]

---

## 1. Contexto Oficial del Evento Local (Neiva, Huila)

- **Sede:** Neiva, Huila ([Evento Local Neiva](https://www.spaceappschallenge.org/2026/local-events/neiva/?tab=schedule))
- **Desafío:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=details)
- **Fechas y Horario Presencial:** Sábado 14 y Domingo 15 de noviembre de 2026 (ingreso 8:30 a. m., actividades 9:00 a. m. – 5:00 p. m.).
- **Cierre Oficial del Portal NASA:** Domingo 15 de noviembre de 2026 a las **11:59 p. m.** (`Save Progress` continuo + `Submit for Judging`).
- **Aprobación de Base Previa:** Los organizadores locales confirmaron desde la primera reunión que es válido continuar sobre el repositorio base y realizar sobre él las integraciones y ajustes requeridos por los nuevos recursos del reto.
- **Documento Maestro en Google Docs (4 Pestañas):** [Proyecto Nasa — Documento Maestro (Google Docs)](https://docs.google.com/document/d/11M8ZQrT3TRZ6_gqd6MHrb-t6v0x3BwdOTVZWiQskOhs/edit)
  - Pestaña 1 (`t.6wx1szgczhd9`): *1. Cronograma Neiva y Equipo*
  - Pestaña 2 (`t.5ibykogs5fi`): *2. Arquitectura y Fuentes NASA-CSA*
  - Pestaña 3 (`t.svntdcq99gjw`): *3. Entrega Oficial Portal (EN-ES)*
  - Pestaña 4 (`t.lwwqu8iorwk3`): *4. Sustentación y 7 Diapositivas*

### Checklist Obligatorio de Sala y Plataforma
1. Verificar en *My Team* que los **6 integrantes** figuren aceptados (ninguno en *waitlist*) y asociados al evento local **Neiva**.
2. Reemplazar la descripción obsoleta (*"DB-Runtime, dos desarrolladores"*) por la biografía real de los 6 integrantes en inglés.
3. **Regla obligatoria de almuerzo (Sábado 12:30–13:30 y Domingo 12:00–13:00):** rotar en dos turnos de 3 personas para mantener siempre **mínimo 2 integrantes en el puesto**.
4. **Demo Elegida:** **Opción A — Presentación de máximo 7 diapositivas (portada incluida)** redactada en **inglés**, verificada en ventana incógnito antes de enviar.

---

## 2. Estado Vivo y Delegación de Ajustes por Integrante (6 Miembros)

| Integrante | Rol | Tareas ClickUp Asignadas | Estado Vivo Actual | Objetivo Concreto 14–15 Noviembre |
| :--- | :--- | :--- | :---: | :--- |
| **Diego Arias** | 3D WebGL & Frontend | [`[S4-T4]`](https://app.clickup.com/t/86e3ban2g) / [`[S4-T4.1]`](https://app.clickup.com/t/86e3ban2j) | `desarrollando` 🟡 | **Realizando ajustes activos en Frontend:** diseño responsivo (390 px y desktop), créditos/capas para nuevas fuentes NASA/CSA, estabilidad WebGL 60 FPS y capturas 1080p para diapositivas. |
| **Emilse Cabrera** | Física Climática y QA | [`[PHYS-T1]`](https://app.clickup.com/t/1dfmnrzd7ug) .. [`[PHYS-T5]`](https://app.clickup.com/t/1dfmnrzd7v0) | `to do` ⚪ (Revisión activa) | **Revisando fuentes de datos a consultar** (AppEEARS, Hydrology Time Series, NOAA CDO, CSA SWOT/RCM, KNMI), contrastando coherencia física y ejecutando QA integral el domingo **11:00 a. m. – 12:00 m.** |
| **Fabriany Medina** | Data & ETL (DuckDB) | [`[S4-T2]`](https://app.clickup.com/t/86e3ban1w) | `to do` ⚪ | Extraer muestras reales abiertas de **AppEEARS, Giovanni, Hydrology Time Series, NOAA CDO y CSA SWOT** para seeders/DuckDB sin depender de credenciales en vivo. |
| **Johan Olaya** | Data Science & Estadística | [`[S4-T6]`](https://app.clickup.com/t/1dfmnrzd7wh) *(S4-T3 `complete`)* | `to do` ⚪ | Validación cruzada de Mann-Kendall y Sen's Slope contra **KNMI Climate Explorer**, documentación metodológica del paper **NASA SeaWiFS (NTRS 20090042747)** y coordinación lag-1 con Emilse. |
| **Daniela Ramos (July)** | Backend Lead (.NET 10) | [`[S4-T7]`](https://app.clickup.com/t/1dfmnrzd7wn) *(S4-T1 `complete`)* | `to do` ⚪ | Exponer metadatos/procedencia transparente de las nuevas fuentes NASA/CSA/KNMI en `GET /api/datasets`, verificar DuckDB/Brotli en Render (256 MB) y pruebas Swagger. |
| **Brayan Stid Cortés** | Frontend Lead, Docs & Pitch | [`[S4-T5]`](https://app.clickup.com/t/86e3ban2t) | `to do` ⚪ | Documentación maestra (Obsidian, Google Doc, `claude-mem`), diseño de las **7 diapositivas en inglés (Opción A)**, declaración IA, bio de 6 integrantes y envío oficial en el portal NASA. |

---

## 3. Mapa Técnico: Nuevos Recursos Oficiales vs. Estado del Repositorio

| Recurso Oficial Liberado | Cómo Funciona Hoy en el Código | Ajuste Asignado (Sprint I y II — Neiva) |
| :--- | :--- | :--- |
| **NASA GISTEMP v4** (`data.giss.nasa.gov`) | Ingestión pública real (`RequiresAuthentication: false` en `NasaDatasetCatalog.cs`). | Mantener como referencia térmica base y validar serie histórica extendida (`[S4-T6]`). |
| **NASA Giovanni & AppEEARS** (`giovanni.gsfc.nasa.gov`, `appeears.earthdatacloud.nasa.gov`) | `MODIS NDVI` y `OCO-2 CO₂` figuran con `RequiresAuthentication: true` en catálogo y usan escenario demo cuando falta token. | **Fabriany (`S4-T2`) + Emilse (`PHYS`):** descargar CSV/series abiertas preempaquetadas en DuckDB para operar sin credenciales en vivo. |
| **NASA Hydrology Time Series & CSA SWOT / RCM / Geo.ca** (`disc.gsfc.nasa.gov`, `donnees-data.asc-csa.gc.ca/en/dataset/rcm`, `asc-csa.gc.ca/eng/satellites/swot/`, `geo.ca`) | `GRACEMass` modela almacenamiento terrestre/hielo (`cm EWH`), pero faltan créditos explícitos o capa/misión hidrológica vinculada a SWOT y RCM. | **Fabriany (`S4-T2`) + Daniela (`S4-T7`) + Diego (`S4-T4`):** integrar procedencia y muestra o caso guiado hidrológico/costero NASA-CSA visible en UI y API. |
| **NOAA Climate Data Online (CDO)** (`ncei.noaa.gov/cdo-web/`) | Sin integración directa como estación histórica puntual de tierra. | **Emilse (`PHYS-T2`) + Fabriany (`S4-T2`):** usar serie de estación puntual CDO como validación terrestre complementaria al pixel satelital. |
| **NASA SeaWiFS Chlorophyll Paper (`NTRS 20090042747`)** | Motor estadístico ya implementa Mann-Kendall + Sen's Slope (`MannKendallCalculator.cs`, `SensSlopeEstimator.cs`), sin cita explícita al caso costero-fluvial en docs/UI. | **Johan (`S4-T6`):** integrar cita metodológica oficial y contrastar caso costero influenciado por ríos. |
| **KNMI Climate Explorer** (`climexp.knmi.nl`) | No existía tabla de contraste externo contra KNMI. | **Johan (`S4-T6`) + Emilse (`PHYS-T4`):** comparar pendientes y p-valores en 3 regiones clave y anexar tabla al Pitch y Anexo Científico. |
