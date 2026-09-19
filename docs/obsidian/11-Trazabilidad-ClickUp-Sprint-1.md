# 📋 Trazabilidad en ClickUp — Sprint 1: Infraestructura, Gobernanza y Despliegue

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Sprint 1: Datos, ETL y Arquitectura Base` (ID: `901717181777`)
- **Automatizador:** `clickup-task-automator` (Node.js + TypeScript + ClickUp API v2)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[04-Sprints-y-Roadmap]], [[09-Gobernanza-GitHub-Org-y-Projects]], [[10-Despliegue-Cloud-Vercel-Render]]

---

## 🎯 Tarea Principal de Infraestructura y Despliegue

* **Código:** `[S1-T0]`
* **ID ClickUp:** `86e3bbaxc`
* **Nombre:** **[S1-T0] Despliegue en la Nube (Vercel & Render), Blindaje de Ramas y Gobernanza de Equipos**
* **URL:** [https://app.clickup.com/t/86e3bbaxc](https://app.clickup.com/t/86e3bbaxc)
* **Estado:** `Complete` ✅
* **Prioridad:** Urgent (1) 🔴
* **Asignados:** Todo el equipo (Brayan Stid Cortés, July, Fabriany Medina, Johan Sebastian Olaya, Diego Arias)
* **Horas Estimadas:** 16h

---

## 🧩 Subtareas Atómicas Vinculadas

| Código | Subtarea | ID ClickUp | Asignado(s) | Estado | Prioridad | Enlace |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **S1-T0.1** | Despliegue de Frontend en Vercel Edge con SPA Routing y proxy API | `86e3bbazf` | Brayan | `Complete` ✅ | Urgente (1) | [Ver Tarea](https://app.clickup.com/t/86e3bbazf) |
| **S1-T0.2** | Despliegue de Backend .NET 10 en Render Cloud con Blueprint `render.yaml` | `86e3bbazg` | July, Brayan | `Complete` ✅ | Urgente (1) | [Ver Tarea](https://app.clickup.com/t/86e3bbazg) |
| **S1-T0.3** | Blindaje de ramas con GitHub Rulesets v2 (Anti-Force Push y Anti-Deletion) | `86e3bbazj` | Brayan, July | `Complete` ✅ | Urgente (1) | [Ver Tarea](https://app.clickup.com/t/86e3bbazj) |
| **S1-T0.4** | Creación de equipos en GitHub (`backend-team`, `frontend-team`), `CODEOWNERS` y `TEAM.md` | `86e3bbazk` | Todos (5) | `Complete` ✅ | Urgente (1) | [Ver Tarea](https://app.clickup.com/t/86e3bbazk) |
| **S1-T0.5** | Panel de acceso rápido para desarrolladores en README y GitHub Environments | `86e3bbazn` | Brayan | `Complete` ✅ | Urgente (1) | [Ver Tarea](https://app.clickup.com/t/86e3bbazn) |

---

## 🛠️ Detalles Técnicos Registrados por Subtarea

### 1. [S1-T0.1] Despliegue Frontend en Vercel Edge
* Configuración de `apps/web/vercel.json` con regla de reescritura SPA: `/(.*) -> /index.html`.
* Pipeline CI/CD automático vinculado a la rama `production` de GitHub.
* Producción oficial activa en: **[nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app/)**.

### 2. [S1-T0.2] Despliegue Backend .NET 10 en Render Cloud
* Blueprint de infraestructura como código `render.yaml` en la raíz del repositorio.
* Dockerfile multi-stage basado en SDK .NET 10 Preview y runtime Linux/Alpine.
* Inyección dinámica de puerto `$PORT` en `Program.cs` (`http://0.0.0.0:${port}`).
* Endpoint de verificación de salud operacional: **[nasa-trend-detective-api.onrender.com/health](https://nasa-trend-detective-api.onrender.com/health)** respondiendo `Healthy`.

### 3. [S1-T0.3] Blindaje de Ramas con GitHub Rulesets v2
* Protección aplicada a `production`, `qa` y `development`.
* `Block force pushes` activado (Anti-Force Push estricto para evitar pérdidas de historial).
* `Prevent branch deletion` activado.
* Obligatoriedad de Pull Requests y revisiones de pares antes de fusionar.

### 4. [S1-T0.4] Gobernanza de Equipos en GitHub y CODEOWNERS
* Equipos creados en la organización `@nasa-trend-detective`:
  * `@nasa-trend-detective/backend-team` (July, Fabriany, Brayan)
  * `@nasa-trend-detective/frontend-team` (Johan, Diego, Brayan)
* Archivo `.github/CODEOWNERS` activo para asignación automática de PRs según rutas.
* Documento `TEAM.md` en la raíz con roles, especialidades y acuerdos de equipo.

### 5. [S1-T0.5] Panel de Acceso Rápido para Desarrolladores
* Tabla de accesos directos en el `README.md` principal del repositorio.
* Enlaces rápidos a Frontend Vercel, Backend Render, Health Check, Swagger UI y Render Dashboard.
* Configuración de GitHub Environments (`production`, `qa`, `development`) con badges visuales.
