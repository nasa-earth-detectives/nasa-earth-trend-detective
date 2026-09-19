# 🌍 NASA Earth System Trend Detective - Base de Conocimiento (MOC)

> **NASA International Space Apps Challenge 2026**  
> **Categoría:** Ciencias de la Tierra (*Earth Science*)  
> **Equipo:** July, Fabriany Medina (Reving), Johan Sebastian Olaya, Diego Arias, Brayan Stid Cortés (bscl).

---

## 🗺️ Mapa de Contenido del Proyecto

Bienvenido a la bóveda central de documentación y diseño de ingeniería de nuestra plataforma de detección de tendencias biofísicas globales. Utiliza los siguientes enlaces para navegar por las especificaciones del sistema:

### 🏛️ Arquitectura & Organización
- [[01-Arquitectura-Monorrepo]]: Estructura unificada de `backend/`, `frontend/` y paquetes compartidos (`packages/`).
- [[02-Estrategia-Git-3-Ramas]]: Protocolo estricto de ramas (`development` ➔ `qa` ➔ `production`).
- [[03-Roles-y-Equipo]]: Perfiles técnicos y asignación de responsabilidades de los 5 participantes.
- [[08-Contenedores-Docker]]: Guía de ejecución unificada con Docker Compose en local y staging.
- [[09-Gobernanza-GitHub-Org-y-Projects]]: Organización de GitHub, CODEOWNERS, rulesets de ramas y tablero Kanban en Projects.

### 🔬 Rigor Científico & Datos NASA
- [[05-Rigor-Cientifico-MannKendall]]: Fórmulas matemáticas del Test de Mann-Kendall, Pendiente de Sen y Motor de Tendencias Opuestas.
- Misiones Satelitales: GISTEMP v4 (Temperatura), MODIS (Vegetación NDVI), GRACE-FO (Masa de hielo y agua), OCO-2 (Dióxido de carbono).

### 🚀 Ciclo de Vida, Sprints & CI/CD
- [[04-Sprints-y-Roadmap]]: Desglose detallado de los 4 Sprints, 20 tareas técnicas y 55 subtareas atómicas vinculadas a ClickUp.
- [[06-Pipeline-CI-CD]]: Automatización de compilación, linters y despliegue a QA, con freno de seguridad antes de producción.
- [[07-Estandares-Ingenieria]]: Directivas de Clean Architecture, clases <150 líneas, tipado estricto y seguridad contra bots.
- [[10-Despliegue-Cloud-Vercel-Render]]: Arquitectura serverless en Vercel Edge y contenedor .NET 10 en Render Cloud.
- [[11-Trazabilidad-ClickUp-Sprint-1]]: Trazabilidad en vivo de la tarea madre [S1-T0] y sus 5 subtareas en ClickUp API v2.

---

## 🧭 Diagrama de Navegación Visual
Para una exploración interactiva en nodos visuales, abre el lienzo:
👉 [[NASA-Detective.canvas]]
