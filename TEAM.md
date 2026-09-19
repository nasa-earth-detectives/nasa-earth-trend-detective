# 👥 Organización del Equipo y Roles Oficiales

> **NASA International Space Apps Challenge 2026**  
> **Proyecto:** NASA Earth System Trend Detective  
> **Organización:** [nasa-earth-detectives](https://github.com/nasa-earth-detectives)  
> **Repositorio Oficial:** [nasa-earth-trend-detective](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective)

---

## 🏛️ Estructura de Subequipos Técnicos

Para maximizar la especialización técnica, velocidad de desarrollo y revisión rigurosa de código, el equipo de 5 participantes está organizado en **2 divisiones de ingeniería**:

```text
                        [ Organización GitHub: nasa-earth-detectives ]
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         [ 🖥️ Backend & Scientific Core ]               [ 🎨 Frontend & 3D Visualization ]
             @backend-team (3 Miembros)                     @frontend-team (2 Miembros)
                      │                                               │
        ┌─────────────┼─────────────┐                         ┌───────┴───────┐
        ▼             ▼             ▼                         ▼               ▼
     [ July ]     [ Reving ]    [ Johan ]                 [ Brayan ]      [ Diego ]
     Lead Back     Data/ETL    Data Science              Lead Front/UI   WebGL/3D
```

---

## 🛠️ Perfiles y Responsabilidades Individuales

### 1. Subequipo Backend & Núcleo Científico
👉 **Equipo en GitHub:** [@nasa-earth-detectives/backend-team](https://github.com/orgs/nasa-earth-detectives/teams/backend-team)

| Integrante | Rol Oficial | Módulos a Cargo en el Monorrepo | Tecnologías Principales |
| :--- | :--- | :--- | :--- |
| **July** | **Lead Backend & Arquitectura** | `backend/src/NasaTrendDetective.Api/`<br>`backend/src/NasaTrendDetective.Domain/` | C# .NET 10, Clean Architecture, APIs REST, Rate Limiting, Seguridad Anti-Bots |
| **Fabriany Medina (Reving)** | **Data & ETL Engineer** | `backend/src/NasaTrendDetective.Infrastructure/`<br>`data/` | Ingesta Satelital NASA (GISTEMP, MODIS, GRACE-FO, OCO-2), DuckDB OLAP, Parquet |
| **Johan Sebastian Olaya Reyes** | **Data Scientist & Modelado Estadístico** | `backend/src/NasaTrendDetective.Application/`<br>`backend/src/NasaTrendDetective.Domain/` | Test de Mann-Kendall ($S$, $\text{Var}(S)$, $Z$, $p < 0.05$), Pendiente de Sen, Opposing Trends Engine |

---

### 2. Subequipo Frontend & Visualización 3D
👉 **Equipo en GitHub:** [@nasa-earth-detectives/frontend-team](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team)

| Integrante | Rol Oficial | Módulos a Cargo en el Monorrepo | Tecnologías Principales |
| :--- | :--- | :--- | :--- |
| **Brayan Stid Cortés Lombana (bscl)** | **Frontend Lead, UI/UX & Pitch** | `frontend/src/`<br>`frontend/src/components/`<br>`packages/shared/`<br>`docs/` | React 19, Tailwind CSS, Glassmorphism, Time-Slider (2000-2026), Inspector Panel, Storytelling Pitch NASA |
| **Diego Arias** | **3D WebGL Specialist** | `frontend/src/components/Globe/`<br>`public/textures/`<br>`public/models/` | Three.js, Globe.gl, Capas de Hexágonos 3D, Shaders GLSL, Optimización a 60 FPS |

---

## 🛡️ Matriz de Gobernanza y Revisión de Pull Requests (CODEOWNERS)

Las revisiones de código son automáticas y obligatorias según el módulo modificado:

```
Ruta en Monorrepo                     Equipo Revisor Obligatorio
─────────────────────────────────────────────────────────────────────────────
backend/                              @nasa-earth-detectives/backend-team
data/                                 @nasa-earth-detectives/backend-team
frontend/src/components/Globe/        @nasa-earth-detectives/frontend-team
frontend/                             @nasa-earth-detectives/frontend-team
packages/shared/                      @nasa-earth-detectives/frontend-team + @nasa-earth-detectives/backend-team
docs/                                 @brayancortes22 (Lead Architect)
```

- **Regla de Aprobación:** Todo Pull Request requiere al menos **1 aprobación técnica** del subequipo asignado antes de poder ser fusionado en `development`, `qa` o `production`.
- **Cero Código Directo:** Nadie puede hacer push directo a las ramas maestras.
