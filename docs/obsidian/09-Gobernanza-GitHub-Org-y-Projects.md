# 🏛️ Gobernanza del Repositorio: Organización, Projects y Rulesets

Volver al [[00-Map-Of-Content]] | [[02-Estrategia-Git-3-Ramas]]

---

## 👥 1. Organización Oficial en GitHub

El monorrepo está alojado oficialmente en la **Organización de GitHub**:
👉 **URL de la Organización:** [https://github.com/nasa-earth-detectives](https://github.com/nasa-earth-detectives)  
👉 **Repositorio Oficial:** [https://github.com/nasa-earth-detectives/nasa-earth-trend-detective](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective)

### Distribución de Roles para los 5 Participantes:
- **Owners (2 Administradores):** Brayan Stid Cortés (@brayancortes22) y July (garantiza respaldo sin dependencia de una sola cuenta).
- **Members (3 Integrantes):** Fabriany Medina (Reving), Johan Olaya y Diego Arias.
- **Equipos en GitHub Organization (Teams):**
  - [developers](https://github.com/orgs/nasa-earth-detectives/teams/developers): Todos los 5 participantes con permisos de lectura y escritura base.
  - [backend-team](https://github.com/orgs/nasa-earth-detectives/teams/backend-team): July, Reving y Johan (Revisores CODEOWNERS de Backend, ETL y Matemáticas).
  - [frontend-team](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team): Brayan y Diego (Revisores CODEOWNERS de UI/UX, Componentes y WebGL 3D).

---

## 🔒 2. Reglas de Protección de Ramas Activas (Branch Protection)

Las 3 ramas oficiales del repositorio cuentan con protección automática configurada:
- **`production`**:
  - ☑ *Require a pull request before merging* (Aprobación obligatoria de un Owner).
  - ☑ *Require review from Code Owners* activo vía `CODEOWNERS`.
  - ☑ *Dismiss stale pull request approvals when new commits are pushed*.
  - ☑ *Block force pushes* y *Block branch deletions*.
- **`qa`**:
  - ☑ *Require a pull request before merging*.
  - ☑ *Require review from Code Owners* activo.
  - ☑ *Block force pushes*.
- **`development`** (Rama predeterminada de desarrollo):
  - ☑ *Require a pull request before merging* (Mínimo 1 aprobación técnica).
  - ☑ *Require review from Code Owners* activo.
  - ☑ *Block force pushes*.

---

## 📋 3. Tablero de Gestión: GitHub Projects

👉 **Tablero Kanban Oficial:** [https://github.com/orgs/nasa-earth-detectives/projects/1](https://github.com/orgs/nasa-earth-detectives/projects/1)

Columnas configuradas para los 4 Sprints:
1. **📥 Backlog:** Ideas, requerimientos futuros y datasets adicionales de la NASA.
2. **📋 To Do:** Tareas atómicas priorizadas del sprint actual.
3. **🚧 In Progress:** Tareas en desarrollo activo (asociadas a una rama `feat/*`).
4. **👀 Review:** Pull Requests abiertos pendientes de revisión según `CODEOWNERS`.
5. **✅ Done:** Código fusionado en `development` y verificado en staging.

---

## 🛡️ 4. Blindaje y Pauta Anti-IA para el Jurado de la NASA
- **Regla Estricta:** No conectar extensiones, bots visibles ni aplicaciones externas de IA al repositorio en GitHub.
- Los metadatos de GitHub, descripciones de Issues, PRs y commits son 100% técnicos y redactados por el equipo, demostrando dominio pleno del dominio biofísico y arquitectónico ante el jurado calificador de la NASA.
