# 📋 Trazabilidad en ClickUp — Sprint 3: Experiencia 3D, Tendencias Opuestas e Integración

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Sprint 3: Experiencia 3D Avanzada, Tendencias Opuestas e Integración` (ID: `901717181779`)
- **Automatizador:** `clickup-task-automator` (Node.js + ClickUp API v2)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[04-Sprints-y-Roadmap]], [[05-Rigor-Cientifico-MannKendall]], [[17-Time-Slider-Interactivo-y-Control-Multivelocidad]]

---

## 🎯 Tarea Principal de UI Interactiva: Time-Slider Espacial 2000-2026

* **Código:** `[S3-T5]`
* **ID ClickUp:** `86e3ban1d`
* **Nombre:** **[S3-T5] Construir componente interactivo Time-Slider (2000-2026) con marcas de hitos históricos**
* **URL:** [https://app.clickup.com/t/86e3ban1d](https://app.clickup.com/t/86e3ban1d)
* **Estado:** `Complete` 🟢 (Completado y desplegado en Producción Oficial v1.0.0-rc1)
* **Prioridad:** Normal (3) 🔵
* **Asignado:** Brayan Stid Cortés Lombana (`Participante 5 / Frontend Lead & UI/UX`)
* **Horas Estimadas:** 6h
* **Pull Request:** Integrado en PR #11 y promovido en PR #17

### Subtareas Vinculadas a S3-T5:
| Código | Subtarea | ID ClickUp | Asignado | Estado | Prioridad | Componentes Clave |
| :--- | :--- | :---: | :--- | :---: | :---: | :--- |
| **S3-T5.1** | Diseñar barra de tiempo horizontal con marcas para cada año (2000-2026) | `86e3ban1f` | Brayan | `Complete` 🟢 | Normal (3) | `src/components/Timeline/TimeSlider.tsx` |
| **S3-T5.2** | Implementar controles de reproducción (Play, Pause, Step Forward/Back, Velocidad) | `86e3ban1h` | Brayan | `Complete` 🟢 | Normal (3) | Controles 1x/2x/5x, animación fluida en `TimeSlider.tsx` |
| **S3-T5.3** | Conectar eventos de cambio de año con actualización de capas de datos 3D | `86e3ban1j` | Brayan | `Complete` 🟢 | Normal (3) | `src/context/ClimateContext.tsx`, `useGlobeScene.ts` |

---

## 📊 Estado y Especificación Técnica del Sprint 3 en ClickUp

| Código | Tarea Principal | Responsable | ID ClickUp | Estado | Especificación Técnica Clave |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **[S3-T1]** | Seguridad de API, Rate Limiting y Caché | July (Daniela Ramos) | `86e3ban0t` | `Complete` 🟢 | Rate Limiting dinámico particionado por IP, IMemoryCache distribuido (<1ms hit) y Middleware anti-bots / Honeypot perimetral. |
| **[S3-T2]** | Optimización de Consultas DuckDB <50ms | Fabriany Medina | `86e3ban11` | `to do` ⚪ | Vistas analíticas pre-agregadas, índices por año/geolocalización y benchmark con latencia <50ms. |
| **[S3-T3]** | Motor de Tendencias Opuestas (Opposing Trends) | Johan Olaya | `86e3ban18` | `Complete` 🟢 | Detección de divergencias regionales (+Z vs -Z), 3 casos de estudio NASA (Ártico/Atlántico, Amazonas/China, Groenlandia/Antártida) y servicio `IOpposingTrendsService`. |
| **[S3-T4]** | Anillos Pulsantes (Ripples) y Arcos 3D | Diego Arias | `86e3ban1c` | `Complete` 🟢 | Ripples en hotspots críticos, arcos parabólicos con Three.js conectando teleconexiones climáticas, constelación de satélites NASA en órbita y 60 FPS estables. |
| **[S3-T5]** | Time-Slider Interactivo (2000-2026) | Brayan Stid Cortés | `86e3ban1d` | `Complete` 🟢 | Slider 2000-2026 con marcas de hitos, selector 1x/2x/5x y reactividad global con el visor 3D. |

---

## 🛰️ Tarea de Visualización 3D: Arcos de Teleconexión, Radar Ripples y Satélites [S3-T4]

* **Código:** `[S3-T4]`
* **ID ClickUp:** `86e3ban1c`
* **Nombre:** **[S3-T4] Anillos Pulsantes (Ripples), Arcos de Teleconexión 3D y Constelación Satelital NASA**
* **URL:** [https://app.clickup.com/t/86e3ban1c](https://app.clickup.com/t/86e3ban1c)
* **Estado:** `Complete` 🟢 (Completado y fusionado en `development`)
* **Prioridad:** High (2) 🟡
* **Asignado:** Diego Arias (`Participante 4 / 3D WebGL Lead`) — Asistido por equipo
* **Módulos Desarrollados:**
  - `earthTeleconnectionArcs.ts`: Arcos parabólicos 3D (AMOC, Sahara-Amazonas, ENSO, ACC) con pulsos de luz animados.
  - `earthRadarRipples.ts`: Ondas de radar concéntricas (`ringsData`) en hotspots climáticos (Svalbard, Subpolar Gyre, Amazonia, Groenlandia, China Oriental).
  - `earthSatelliteOrbits.ts`: Constelación de satélites NASA en órbita 3D (Terra, Aqua, GRACE-FO, OCO-2) con paneles solares, conos de escaneo y trazado orbital.
  - `earthLiveSystem.ts`: Fachada modular unificadora que orquesta las 3 capas sin sobrepasar 180 líneas en `useGlobeScene.ts`.
