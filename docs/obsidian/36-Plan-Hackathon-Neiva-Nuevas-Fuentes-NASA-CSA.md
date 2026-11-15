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

## 2. Estado Vivo y Delegación de Ajustes por Integrante (6 Miembros — Sincronizado 2026-11-14)

| Integrante | Rol | Tareas ClickUp Asignadas | Estado Vivo Actual | Objetivo Concreto 14–15 Noviembre |
| :--- | :--- | :--- | :---: | :--- |
| **Diego Arias** | 3D WebGL & Frontend | [`[S4-T4]`](https://app.clickup.com/t/86e3ban2g) (`S4-T4.1 complete`) | `desarrollando` 🟡 | **S4-T4.1 completado** tras PR #75 (UI 100 % en inglés + QA 1440/390 px). Pendiente `S4-T4.2` (WebGL 60 FPS) y `S4-T4.3` (capturas 1080p para las 7 diapositivas). |
| **Emilse Cabrera** | Física Climática y QA | [`[PHYS-T1]`](https://app.clickup.com/t/1dfmnrzd7ug) .. [`[PHYS-T5]`](https://app.clickup.com/t/1dfmnrzd7v0) | `ClickUp: to do ⚪` / `GitHub: Review` | Código real `9/9`, preblanqueo iterativo, BH FDR y suite `2000–2025` ya listos; ejecutando aval físico final de puntos abiertos (`Nota 40 §8`) y QA en vivo (`#66–#70`). |
| **Fabriany Medina** | Data & ETL (DuckDB) | [`[S4-T2]`](https://app.clickup.com/t/86e3ban1w) (`GitHub #59 Done`) | `complete` 🟢 | **Entregado:** **9/9** datasets reales en Parquet (~34.7 MB) operando 100 % offline en DuckDB + cubiertos por validación `2000–2025` (PR #77). |
| **Johan Olaya** | Data Science & Estadística | [`[S4-T6]`](https://app.clickup.com/t/1dfmnrzd7wh) *(S4-T3 `complete`)* | `en pruebas` 🟣 (`Review`) | SciPy 1.18.1, simulación AR(1) y suite `2000–2025` real + APIs vivas NASA listos (PR #77: 209/209 + 3/3). Pendiente tabla manual KNMI, ficha SeaWiFS NTRS y aval con Emilse. |
| **Daniela Ramos (July)** | Backend Lead (.NET 10) | [`[S4-T7]`](https://app.clickup.com/t/1dfmnrzd7wn) *(S4-T1 `complete`)* | `en pruebas` 🟣 (`Review`) | **S4-T7.1 y S4-T7.2 completados** (`9/9` procedencia en `GET /api/datasets`, `UpdateProvenance`, ventana `2000–2025`). Pendiente `S4-T7.3` (smoke tests en Render). |
| **Brayan Stid Cortés** | Frontend Lead, Docs & Pitch | [`[S4-T5]`](https://app.clickup.com/t/86e3ban2t) | `desarrollando` 🟡 | Dossier EN [[35-NASA-Space-Apps-Official-Submission-En]] y UI EN listos; actualizando Google Doc maestro, bio de 6 integrantes, 7 diapositivas (Opción A) y envío final NASA. |

---

## 3. Mapa Técnico: Nuevos Recursos Oficiales vs. Estado Real del Repositorio

| Recurso Oficial Liberado | Cómo Funciona Hoy en el Código (`development`) | Estado / Siguiente Paso |
| :--- | :--- | :--- |
| **NASA GISTEMP v4** (`data.giss.nasa.gov`) | Ingestión pública real (`2000–2026`) y Parquet semilla en DuckDB; contrastado contra `GLB.Ts+dSST.csv` en vivo en `LiveNasaApiValidationTests` (PR #77). | **Operativo y validado (`2000–2025`)**; mantener como referencia térmica (`[S4-T6]`). |
| **NASA POWER (`MERRA-2` & `GPM IMERG`)** | 4 variables MERRA-2 (`T2M`, `PRECTOTCORR`, `EVLAND`, `GWETROOT`, `1981–2025`) e `IMERG` (`1998–2025`) ingestadas y usadas en los 4 pares opuestos reales; `LiveNasaApiValidationTests` valida contra `power.larc.nasa.gov`. | **Operativo y validado (`2000–2025`)**. IMERG conserva etiqueta honesta de *reviewing* en POWER. |
| **NASA GIBS (`MODIS NDVI` & `OCO-2 XCO₂`) + `GSFC GRACE`** | **NDVI** (`2000–2025`), **OCO-2 V11.2r** (`2015–2025`, 55,632 filas) y **GRACE mascons `RL06v2.0`** (`2002–2025`, 1.47M filas) operan 100 % offline sin token. *AppEEARS* fue descartado por latencia. | **Operativo (9/9 datasets reales)** tras migración en `[S4-T2]`; pendiente revisión física de GRACE (`[PHYS-T2]`). |
| **NASA Hydrology Data Rods & CSA SWOT / RCM / Geo.ca** | *Hydrology Data Rods* respondió aviso oficial de descontinuación (`docs/obsidian/35`). `GraceMass` usa mascons NASA GSFC; CSA SWOT/RCM/Geo.ca no integrados como fuente directa. | **Alcance documentado:** CSA SWOT/RCM queda como trabajo futuro opcional si Física lo prioriza. |
| **NOAA Climate Data Online (CDO)** (`ncei.noaa.gov/cdo-web/`) | Sin integración directa como estación histórica puntual de tierra. | Pendiente solo como validación externa opcional en tierra (`[PHYS-T2]`). |
| **NASA SeaWiFS Chlorophyll Paper (`NTRS 20090042747`)** | Motor estadístico ya implementa Mann-Kendall, Sen, preblanqueamiento iterativo, prueba t y FDR Benjamini-Hochberg; falta ficha bibliográfica dedicada en Pitch/Anexo. | **Johan (`S4-T6.2`):** redactar ficha metodológica oficial para Slide 5 y Anexo Científico. |
| **KNMI Climate Explorer** (`climexp.knmi.nl`) | Pendiente tabla comparativa externa manual frente a KNMI (estadística actual verificada contra SciPy 1.18.1 a 6–9 decimales). | **Johan (`S4-T6.1`) + Emilse (`PHYS-T4`):** generar tabla comparativa en 3 regiones clave. |
