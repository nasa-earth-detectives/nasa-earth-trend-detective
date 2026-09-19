# 🏛️ Gobernanza del Repositorio: Organización, Projects y Rulesets

Volver al [[00-Map-Of-Content]] | [[02-Estrategia-Git-3-Ramas]]

---

## 👥 1. Creación y Estructura de la Organización en GitHub

Para un proyecto competitivo de la NASA, es fundamental alojar el monorrepo bajo una **Organización de GitHub** en lugar de una cuenta personal:

1. **Crear Organización:** En tu perfil de GitHub -> *Your organizations* -> *New organization* -> Seleccionar plan **Free** (recomendado para proyectos abiertos).
2. **Nombre sugerido:** `nasa-earth-detectives` o `earth-trend-detective`.
3. **Distribución de Roles para los 5 Participantes:**
   - **Owners (2 Administradores):** Brayan Stid Cortés y July (garantiza respaldo sin dependencia de una sola cuenta).
   - **Members (3 Integrantes):** Fabriany Medina (Reving), Johan Olaya y Diego Arias.
4. **Equipo (Team):** Crear el equipo `developers` con permisos de **Write** en el repositorio para desarrollo activo.

---

## 🔒 2. Configuración de Reglas de Protección (Rulesets)

En el repositorio: *Settings -> Rules -> Rulesets -> New branch ruleset*.

Configurar reglas para las ramas protegidas:
- **`production`**:
  - ☑ *Require a pull request before merging* (Mínimo 1 aprobación de un Owner).
  - ☑ *Require branches to be up to date before merging*.
  - ☑ *Block force pushes*.
  - ☑ *Restrict deletions*.
- **`qa`**:
  - ☑ *Require status checks to pass* (Pipeline `ci-qa.yml` exitoso).
  - ☑ *Require a pull request before merging*.
  - ☑ *Block force pushes*.
- **`development`**:
  - ☑ *Require a pull request before merging* (1 aprobación de compañero según `CODEOWNERS`).
  - ☑ *Block force pushes*.

---

## 📋 3. Tablero de Gestión: GitHub Projects

Crear un proyecto Kanban dentro de la Organización con las 5 columnas estándar:
1. **📥 Backlog:** Ideas, requerimientos futuros y datasets adicionales de la NASA.
2. **📋 To Do:** Tareas atómicas priorizadas del sprint actual.
3. **🚧 In Progress:** Tareas en desarrollo activo (asociadas a una rama `feat/*`).
4. **👀 Review:** Pull Requests abiertos pendientes de revisión de código.
5. **✅ Done:** Código fusionado en `development` y verificado en staging.

---

## 🛡️ 4. Blindaje y Pauta Anti-IA para el Jurado de la NASA
- **Regla Estricta:** No conectar extensiones, bots visibles ni aplicaciones externas de IA al repositorio en GitHub.
- Los metadatos de GitHub, descripciones de Issues, PRs y commits deben ser 100% técnicos y redactados por el equipo, demostrando dominio pleno del dominio biofísico y arquitectónico ante el jurado calificador.
