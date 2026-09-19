# 🏛️ Arquitectura del Monorrepo

Volver al [[00-Map-Of-Content]]

---

## 📐 Visión de Arquitectura

El proyecto adopta un enfoque de **Monorrepo Unificado** para coordinar el trabajo en equipo de los 5 participantes, compartiendo contratos de dominio tipados y facilitando compilaciones reproducibles.

### 📦 Estructura de Directorios

1. **`backend/` (Backend .NET 10 & DuckDB OLAP):**
   - **Clean Architecture:** Desacoplamiento estricto en 4 capas concisas (<150 líneas por archivo):
     - `Domain`: Entidades biofísicas puras, Enums tipados sin cadenas mágicas.
     - `Application`: Motor matemático de Mann-Kendall, Sen's Slope y casos de uso.
     - `Infrastructure`: Conectores a DuckDB embebido columnar y extractores NASA.
     - `Api`: Controladores delgados (Skinny Controllers), Middlewares y Swagger.
   - Ver detalles de roles en [[03-Roles-y-Equipo]].

2. **`frontend/` (Frontend React 19 + TypeScript + Globe.gl):**
   - Lienzo 3D esférico WebGL acelerado por GPU a 60 FPS con texturas NASA.
   - Design System en Modo Oscuro Espacial con efectos de Glassmorphism refinado.
   - Custom Hooks desacoplados (`useGlobeData`, `useTrendAnalysis`).

3. **`packages/shared` (Contratos Compartidos):**
   - Tipos TypeScript compartidos (`EarthVariableType`, `MannKendallResult`, `RegionalTrendSummary`).

---

## 🔗 Enlaces Relacionados
- [[02-Estrategia-Git-3-Ramas]]
- [[08-Contenedores-Docker]]
