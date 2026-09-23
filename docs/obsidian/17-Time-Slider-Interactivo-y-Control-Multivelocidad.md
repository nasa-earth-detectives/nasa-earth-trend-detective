# ⏱️ Time-Slider Interactivo y Control Multivelocidad (2000-2026)

- **Código de Tarea:** `[S3-T5]`, `[S3-T5.1]`, `[S3-T5.2]`, `[S3-T5.3]`
- **Sprint:** Sprint 3: Experiencia 3D, Tendencias Opuestas e Integración
- **Responsable Asignado:** Brayan Stid Cortés Lombana (`bscl`)
- **Componentes Creados:**
  - `frontend/src/config/climateMilestones.ts` (Catálogo de hitos históricos NASA)
  - `frontend/src/components/Controls/ClimateMilestoneTooltip.tsx` (Tooltip científico de hitos)
  - `frontend/src/components/Controls/TimelineTransportControls.tsx` (Botonera multivelocidad y loop)
  - `frontend/src/components/Controls/TimeSliderTrack.tsx` (Barra interactiva, ticks y balizas)
  - `frontend/src/components/Controls/TimeNavigator.tsx` (Orquestador modular < 150 líneas)
  - `frontend/src/hooks/useTimelinePlayback.ts` (Motor reactivo de reproducción)
  - `frontend/src/styles/timeline.css` (Estilos espaciales y animaciones de baliza)
- **Relacionado:** [[00-Map-Of-Content]], [[04-Sprints-y-Roadmap]], [[15-Trazabilidad-ClickUp-Sprint-2]], [[16-Manual-de-Uso-Frontend-y-UI]]

---

## 🎯 Objetivo de la Funcionalidad

Proporcionar a los investigadores y jurados de la NASA una **interfaz de exploración temporal multidecenal (2000-2026)** fluida, ergonómica y estéticamente alineada con el *Spatial Glassmorphism* de la plataforma.

Permite:
1. **Recorrido Automático Continuo:** Simular la evolución climática de la Tierra año a año sin intervención manual.
2. **Control Multivelocidad Dinámico:** Alternar entre velocidades de escaneo:
   - **`1x` (1.200 ms/año):** Ritmo pausado para observación analítica detallada.
   - **`2x` (600 ms/año):** Ritmo moderado de transición interanual.
   - **`5x` (240 ms/año):** Escaneo de alta velocidad multidecenal a 60 FPS.
3. **Modo Bucle (*Loop*):** Repetir automáticamente la animación al llegar a 2026 para demostraciones de pie o pantallas interactivas.
4. **Balizas de Hitos Climáticos de la NASA:** Puntos interactivos con efecto *ping* en la barra temporal que destacan eventos trascendentales documentados por satélites de la NASA.

---

## 🏛️ Arquitectura Modular (Cumplimiento Regla 5: < 150 líneas)

Siguiendo el principio de responsabilidad única (SRP), el componente se desacopló en submódulos especializados:

```
frontend/src/
├── config/
│   ├── climateLayers.ts                   # SATELLITE_TIMELINE ampliado a 2000-2026
│   └── climateMilestones.ts               # Catálogo tipado de 9 hitos clave NASA
├── hooks/
│   └── useTimelinePlayback.ts             # Hook de temporizador dinámico con velocidades y loop
├── components/Controls/
│   ├── TimeNavigator.tsx                  # Contenedor orquestador (149 líneas)
│   ├── TimeSliderTrack.tsx                # Barra de rango, marcas y balizas (125 líneas)
│   ├── TimelineTransportControls.tsx      # Botonera Play/Pause, Velocidad y Bucle (125 líneas)
│   └── ClimateMilestoneTooltip.tsx        # Mini-panel flotante de impacto satelital (44 líneas)
└── styles/
    └── timeline.css                       # Micro-animaciones beacon-pulse y gradientes cian
```

---

## 🛰️ Catálogo de Hitos Climáticos Históricos (2000-2026)

| Año | Hito Histórico | Categoría | Misiones Satelitales Involucradas | Impacto Científico |
| :---: | :--- | :---: | :--- | :--- |
| **2002** | Colapso Plataforma Larsen B | Récord Glaciar | Terra/MODIS, Landsat | Desprendimiento de 3.250 km² en la Antártida en 35 días |
| **2005** | Temporada Ciclónica (Katrina) | Anomalía | Aqua/AIRS, SST satellites | Calentamiento oceánico y récord de 28 tormentas nombradas |
| **2012** | Mínimo Hielo Marino Ártico | Récord Criósfera | DMSP/SSMIS, NASA Cryo | Mínimo histórico polar de 3,41 M km² |
| **2015** | Acuerdo de París sobre el Clima | Gobernanza | NASA Climate Models | Meta vinculante global de 1,5°C |
| **2016** | Máximo Térmico El Niño | Pico Térmico | GISTEMP v4, OCO-2 | Anomalía térmica global de +1,02°C |
| **2020** | Antropausa (COVID-19) | Forzamiento | Sentinel-5P, Aura/OMI | Disminución global transitoria de NO2 y aerosoles |
| **2023** | Año Más Caluroso en 174 Años | Récord Absoluto | NASA GISTEMP, GRACE-FO | Anomalía sostenida de +1,18°C y deshielo antártico |
| **2024** | Cúspide de Anomalía Térmica | Cúspide | GISTEMP v4 | Máximo histórico instrumental de +1,28°C |
| **2026** | Misión Earth Trend Detective | Misión Activa | DuckDB, Three.js, React 19 | Detección interactiva 3D de divergencias globales |

---

## 🧪 Pruebas y Validación Técnica

1. **TypeScript Estricto:** `npm run type-check` ejecutado con 0 errores.
2. **Auditoría de Reglas (`pr-audit-rules.mjs`):** Todos los archivos de código fuente cumplen el límite estricto de < 150 a 170 líneas (0 violaciones de Anti God-Class).
3. **Hot Module Replacement (HMR):** Al probar en el visor interno de Antigravity IDE (`http://localhost:3001/`), los cambios de velocidad (`1x`, `2x`, `5x`) y el cambio de año disparan reactivamente la actualización de la escena 3D y la tarjeta del Detective.
