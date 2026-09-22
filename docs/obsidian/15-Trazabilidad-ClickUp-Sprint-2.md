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
* **Estado:** `desarrollando` 🔵 (En desarrollo activo)
* **Prioridad:** Normal (3) 🔵
* **Asignado:** Brayan Stid Cortés Lombana (`Participante 5 / Frontend Lead & UI/UX`)
* **Horas Estimadas:** 5h
* **Rama de Trabajo:** `feat/s2-t5-detective-card` ➔ `development`

---

## 🧩 Subtareas Atómicas Vinculadas a S2-T5

| Código | Subtarea | ID ClickUp | Asignado | Estado | Prioridad | Componentes Clave |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **S2-T5.1** | Maquetar tarjeta flotante DetectiveCard con Glassmorphism | `86e3ban08` | Brayan | `desarrollando` 🔵 | Normal (3) | `src/components/Detective/DetectiveCard.tsx`, `GlassPanel.tsx` |
| **S2-T5.2** | Crear badges de significancia estadística (\|Z\| > 1.96, p < 0.05) | `86e3ban0a` | Brayan | `desarrollando` 🔵 | Normal (3) | `src/components/Detective/TrendSignificanceBadge.tsx`, `mathTypes.ts` |
| **S2-T5.3** | Integrar gráfico de series temporales interactivo en SVG ligero | `86e3ban0c` | Brayan | `desarrollando` 🔵 | Normal (3) | `src/components/Detective/TimeSeriesChart.tsx`, Sen's slope line |

---

## 🔬 Especificaciones Técnicas del Componente `DetectiveCard`

### 1. `DetectiveCard.tsx` (Contenedor Flotante de Inspección)
- Se activa al hacer clic sobre cualquier coordenada de la superficie terrestre o al buscar una región.
- Contenedor con `GlassPanel` cósmico (`backdrop-filter: blur(16px)`), borde translúcido (`border-white/10`) y elevación espacial.
- Encabezado con coordenadas formateadas (`Latitud: 34.05° N`, `Longitud: 118.24° W`), nombre de región/país y misión satelital activa.
- Cierre accesible con tecla `Escape` o botón de cierre táctil.

### 2. `TrendSignificanceBadge.tsx` (Rigor Estadístico No Paramétrico)
- Basado en los estándares de Mann-Kendall ([[05-Rigor-Cientifico-MannKendall]]):
  * 🔴 **Calentamiento Acelerado:** $Z \ge +1.96$ ($p < 0.05$), pendiente $Q > 0$.
  * 🔵 **Enfriamiento / Deshielo Crítico:** $Z \le -1.96$ ($p < 0.05$), pendiente $Q < 0$.
  * ⚪ **Sin Tendencia Significativa:** $|Z| < 1.96$ ($p \ge 0.05$).
- Micro-animación sutil tipo glow respetando `prefers-reduced-motion`.

### 3. `TimeSeriesChart.tsx` (Gráfico Vectorial SVG Nativo)
- Cero dependencias pesadas (Canvas/SVG nativo para mantener rendimiento a 60 FPS).
- Renderiza la serie temporal de observaciones (2000-2026).
- Superpone la línea de tendencia no paramétrica de la Pendiente de Sen ($Q$).
- Tooltip interactivo al hacer hover/touch sobre cada punto anual con valor numérico y unidad de medida (°C, NDVI, Gt, ppm).

---

## 📊 Estado General de Tareas del Sprint 2 en ClickUp

| Código | Tarea Principal | Responsable | ID ClickUp | Estado |
| :--- | :--- | :--- | :---: | :---: |
| **[S2-T1]** | Endpoints REST y DTOs tipados (.NET 10) | July | `86e3bamzz` | `to do` |
| **[S2-T2]** | Almacén Columnar DuckDB embebido | Fabriany (Reving) | `86e3ban01` | `to do` |
| **[S2-T3]** | Algoritmo de Mann-Kendall y Sen's Slope | Johan | `86e3ban03` | `to do` |
| **[S2-T4]** | Hexágonos 3D y Mapas de Calor dinámicos | Diego | `86e3ban05` | `to do` |
| **[S2-T5]** | Wireframes y maquetación de la tarjeta "Inspector de Detective" | Brayan | `86e3ban07` | `desarrollando` 🔵 |
