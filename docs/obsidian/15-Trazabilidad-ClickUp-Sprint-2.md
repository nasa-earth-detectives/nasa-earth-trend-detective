# 📋 Trazabilidad en ClickUp — Sprint 2: Motor Científico y Pipeline Analítico

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Sprint 2: Algoritmos Científicos, Análisis de Tendencias y UI del Detective` (ID: `901717181778`)
- **Automatizador:** `clickup-task-automator` (Node.js + TypeScript + ClickUp API v2)
- **Tablero Kanban:** [Tablero de Sprint 2](https://app.clickup.com/90177646254/v/b/2kza99t3-957) (ID: `2kza99t3-957`)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[04-Sprints-y-Roadmap]], [[05-Rigor-Cientifico-MannKendall]], [[11-Trazabilidad-ClickUp-Sprint-1]]

---

## 🎯 Tarea Principal de UI Científica: Inspector de Detective

* **Código:** `[S2-T5]`
* **ID ClickUp:** `86e3ban07`
* **Nombre:** **[S2-T5] Wireframes y maquetación de la tarjeta "Inspector de Detective"**
* **URL:** [https://app.clickup.com/t/86e3ban07](https://app.clickup.com/t/86e3ban07)
* **Estado:** `Complete` 🟢 (Completado y desplegado en Producción Oficial v1.0.0-rc1)
* **Prioridad:** Normal (3) 🔵
* **Asignado:** Brayan Stid Cortés Lombana (`Participante 5 / Frontend Lead & UI/UX`)
* **Horas Estimadas:** 5h
* **Rama de Trabajo:** `feat/s2-t5-detective-card` ➔ `development` ➔ `qa` ➔ `production`
* **Pull Request:** Integrado en PR #10 y promovido en PR #17

---

## 🧩 Subtareas Atómicas Vinculadas a S2-T5

| Código | Subtarea | ID ClickUp | Asignado | Estado | Prioridad | Componentes Clave |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **S2-T5.1** | Maquetar tarjeta flotante DetectiveCard con Glassmorphism | `86e3ban08` | Brayan | `Complete` 🟢 | Normal (3) | `src/components/Detective/DetectiveCard.tsx`, `GlassPanel.tsx` |
| **S2-T5.2** | Crear badges de significancia estadística (\|Z\| > 1.96, p < 0.05) | `86e3ban0a` | Brayan | `Complete` 🟢 | Normal (3) | `src/components/Detective/TrendSignificanceBadge.tsx`, `mathTypes.ts` |
| **S2-T5.3** | Integrar gráfico de series temporales interactivo en SVG ligero | `86e3ban0c` | Brayan | `Complete` 🟢 | Normal (3) | `src/components/Detective/TimeSeriesChart.tsx`, Sen's slope line |

---

## 🌐 Especificación Técnica Detallada: [S2-T4] Hexágonos 3D y Mapas de Calor (Diego Arias)

* **Código:** `[S2-T4]` | **ID ClickUp:** `86e3bamzx` | **Asignado:** Diego Arias (3D WebGL Specialist)
* **Objetivo:** Proyectar las observaciones satelitales (`ClimateObservation[]`) como columnas hexagonales 3D extruidas y coloreadas dinámicamente según la anomalía del año activo (2000-2026).
* **Ubicación Modular (Regla 5):** `frontend/src/components/Globe/earthHexLayer.ts` (<150 líneas) desacoplado de `useGlobeScene.ts`.

### 🛠️ APIs y Parámetros Clave de Globe.gl:
1. **Agregación Espacial H3:**
   - `globe.hexBinPointsData(observations)`
   - `globe.hexBinPointLat(d => d.latitude)`
   - `globe.hexBinPointLng(d => d.longitude)`
   - `globe.hexBinPointWeight(d => Math.abs(d.anomaly ?? d.value))`
   - `globe.hexBinResolution(3.5)` *(Resolución esférica óptima para 60 FPS)*
   - `globe.hexMargin(0.12)` *(Definición nítida entre hexágonos)*
2. **Elevación y Paleta Cromática:**
   - `globe.hexAltitude(d => Math.min(d.sumWeight * 0.05, 0.45))`
   - `globe.hexTopColor(d => interpolateVariableColor(d, variable))` *(Sólido, alpha 0.9)*
   - `globe.hexSideColor(d => interpolateVariableSideColor(d, variable))` *(Translúcido, alpha 0.6)*
   - `globe.hexTransitionDuration(800)` *(Transición suave entre años)*
3. **Conexión con el Inspector de Detective:**
   - `globe.onHexClick((hex, event, { lat, lng }) => { locationSelectHandler?.({ lat, lng }); })`
   - Al hacer clic en un hexágono, dispara el inspector y abre la `DetectiveCard` con los datos exactos del punto.

---

## 🦆 Tarea Principal de Datos: Almacén Columnar DuckDB

* **Código:** `[S2-T2]` | **ID ClickUp:** `86e3bamz4` | **Asignado:** Fabriany Medina (Reving)
* **Estado:** `en qa` 🟣 (Integrado en `development` vía PR #23 y promovido a `qa` vía PR #26)
* **Rama de Trabajo:** `feat/s2-t2-duckdb-warehouse` ➔ `development` ➔ `qa` ➔ `production`
* **Documentación técnica:** [[22-Almacen-Columnar-DuckDB]]

| Código | Subtarea | ID ClickUp | Estado | Componentes Clave |
| :--- | :--- | :---: | :---: | :--- |
| **S2-T2.1** | Inicializar conexión DuckDB embebida en .NET | `86e3bamz5` | `en qa` 🟣 | `DuckDbConnectionFactory.cs`, `DuckDbRepository.cs`, `backend/tests/NasaTrendDetective.Tests` |
| **S2-T2.2** | Definir esquemas SQL de hechos y dimensiones analíticas | `86e3bamz7` | `en qa` 🟣 | `Scripts/init_schema.sql`, `DuckDbSchemaInitializer.cs` |
| **S2-T2.3** | Implementar importador masivo de archivos Parquet | `86e3bamzg` | `en qa` 🟣 | `Etl/ParquetImporter.cs`, `Queries/CellAggregationSql.cs` |

---

## 📊 Estado General de Tareas del Sprint 2 en ClickUp

| Código | Tarea Principal | Responsable | ID ClickUp | Estado | Especificación Técnica |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **[S2-T4]** | Hexágonos 3D y Mapas de Calor dinámicos | Diego Arias | `86e3bamzx` | `desarrollando` 🟡 | Integrar `earthHexLayer.ts` con Globe.gl `hexBinPointsData` a 60 FPS. |
| **[S2-T3]** | Algoritmo de Mann-Kendall y Sen's Slope | Johan Olaya | `86e3bamzh` | `Complete` 🟢 | Estadístico S, varianza con empates, Z-score, Sen's slope e intervalos al 95%. Implementado y verificado con 125 tests. |
| **[S2-T2]** | Almacén Columnar DuckDB embebido | Fabriany Medina | `86e3bamz4` | `en qa` 🟣 | DuckDB en C#, esquema analítico y consultas Parquet <50ms. Promovido a QA. Ver [[22-Almacen-Columnar-DuckDB]]. |
| **[S2-T1]** | Endpoints REST y DTOs tipados (.NET 10) | Daniela Ramos | `86e3bamz0` | `Complete` 🟢 | `TrendsController`, DTOs con estadísticas completas, IMemoryCache, ProblemDetails RFC 7807 y suite de integración. |
| **[S2-T5]** | Wireframes y maquetación de la tarjeta "Inspector de Detective" | Brayan Stid Cortés | `86e3ban07` | `Complete` 🟢 | Tarjeta Glassmorphism, Badge Mann-Kendall y gráfica SVG interactiva en producción. |
