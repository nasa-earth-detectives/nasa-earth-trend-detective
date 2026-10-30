# 👥 Roles y Equipo de Trabajo (6 Participantes)

Volver al [[00-Map-Of-Content]]

---

## 🚀 Integrantes del Equipo

### 🖥️ Subequipo Backend & Núcleo Científico
👉 **Team GitHub:** [teams/backend-team](https://github.com/orgs/nasa-earth-detectives/teams/backend-team)

| Participante | Especialidad | Stack Principal | Horas Estimadas |
| :--- | :--- | :--- | :---: |
| **July** | **Lead Backend & Arquitectura** | C# .NET 10, Clean Architecture, APIs, Middlewares | **25h** |
| **Fabriany Medina (Reving)** | **Data & ETL Engineer** | Datasets NASA, DuckDB OLAP, Parquet, Pipelines | **26h** |
| **Johan Sebastian Olaya** | **Data Scientist** | Mann-Kendall, Sen's Slope, Opposing Trends Engine | **28h** |
| **Especialista en Física (Pendiente Correo)** | **Física & Dinámica Climática** | Teleconexiones (ENSO/NAO), Forzamiento Radiativo, GRACE EWH | **25h** |

### 🎨 Subequipo Frontend & Visualización 3D
👉 **Team GitHub:** [teams/frontend-team](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team)

| Participante | Especialidad | Stack Principal | Horas Estimadas |
| :--- | :--- | :--- | :---: |
| **Diego Arias** | **3D WebGL Specialist** | Three.js, Globe.gl, Hexágonos 3D, Shaders 60 FPS | **25h** |
| **Brayan Stid Cortés (bscl)** | **Frontend Lead, UI/UX & Pitch** | React 19, Tailwind CSS, Glassmorphism, Pitch | **24h** |

---

### 📋 Asignaciones Detalladas

#### 1. July (Lead Backend)
- Estructurar solución .NET 10 bajo Clean Architecture con archivos concisos (<150 líneas).
- Endpoints REST `/api/v1/trends` con DTOs inmutables y validaciones tipadas.
- Rate Limiting por IP y filtrado perimetral contra bots.

#### 2. Fabriany Medina / Reving (Data & ETL Engineer)
- Extractores satelitales para GISTEMP v4, MODIS NDVI, GRACE-FO y OCO-2.
- Normalizador espacial a grilla estándar y limpieza de datos nulos.
- Motor DuckDB columnar embebido y optimización de agregaciones multianuales a <50ms.

#### 3. Johan Sebastian Olaya Reyes (Data Scientist)
- Implementación matemática de Mann-Kendall ($S$, $\text{Var}(S)$, $Z$ y $p < 0.05$).
- Estimador de Pendiente de Sen para tasas de cambio por década.
- Algoritmo de detección de tendencias opuestas simultáneas y validación estadística.

#### 4. Diego Arias (3D WebGL Specialist)
- Render esférico WebGL con texturas de alta resolución NASA Blue Marble y Black Marble.
- Capas dinámicas de hexágonos 3D e isolíneas de calor térmico.
- Anillos pulsantes (ripples) en hotspots y arcos atmosféricos entre regiones opuestas a 60 FPS.

#### 5. Brayan Stid Cortés Lombana (Frontend Lead & Pitch)
- Identidad visual espacial con Glassmorphism (`backdrop-filter: blur(16px)`).
- Panel flotante "Inspector de Detective" con gráficas históricas de series de tiempo.
- Time-Slider interactivo (2000 - 2026) con reproducción automática.
- Narrativa, Storytelling del Pitch y preparación de la postulación oficial de la NASA.

#### 6. Nueva Integrante (Especialista en Física - Pendiente Correo)
- Validación física de teleconexiones climáticas (ENSO, NAO, IOD) y consistencia física de arcos en el globo 3D.
- Modelado de balance de masa y anomalía gravitacional de GRACE/GRACE-FO (equivalente en cm de agua líquida vs. deshielo polar).
- Forzamiento radiativo y absorción espectral de CO2 (OCO-2) correlacionado con anomalías térmicas GISTEMP.
- Pre-blanqueamiento (*pre-whitening*) de autocorrelación serial en Mann-Kendall para series geofísicas.
- Trazabilidad y detalle de tareas en [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]].

---

## 🔗 Enlaces Relacionados
- [[04-Sprints-y-Roadmap]]
- [[05-Rigor-Cientifico-MannKendall]]
- [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]]
