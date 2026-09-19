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

## 🔒 2. Blindaje Anti-Force-Push y Reglas de Protección (GitHub Ruleset v2)

El repositorio cuenta con una doble capa de seguridad inquebrantable que aplica a las 3 ramas oficiales (`development`, `qa` y `production`):

### A. Ruleset Global v2: `Strict Shield - No Force Push, No Deletion, Require PR` (ID: `23708910`)
- **🚫 Bloqueo Estricto de Force Pushes (`non_fast_forward`):** Ningún desarrollador puede ejecutar `git push --force` o `git push -f`. Se rechaza cualquier intento de sobreescribir la historia de commits compartida.
- **🚫 Prohibición de Borrado de Ramas (`deletion`):** Queda bloqueado el comando `git push origin --delete <rama>` o la eliminación desde la interfaz web.
- **🛡️ Cero Excepciones (`bypass_actors: []`):** Los administradores y propietarios de la organización **tienen prohibido saltear las reglas** (`current_user_can_bypass: never`). Nadie puede forzar cambios por accidente.
- **👥 Flujo Obligatorio de Pull Requests (`pull_request`):**
  - Mínimo **1 aprobación técnica** de un par antes de fusionar.
  - Revisión estricta de `CODEOWNERS` activa (los cambios en backend requieren aprobación de July, Reving o Johan; los de frontend requieren aprobación de Brayan o Diego).
  - Invalidación automática de aprobaciones previas al enviar nuevos commits (`dismiss_stale_reviews_on_push: true`).
  - Resolución obligatoria de todos los hilos de conversación y comentarios antes del merge.

### B. Doble Capa: Branch Protection Legacy con `enforce_admins: true`
Las tres ramas tienen habilitada la restricción `enforce_admins: true`, asegurando que ni las llamadas API ni la consola administrativa permitan modificar el historial directo.

### C. Comportamiento ante intentos de `push --force`:
Si un desarrollador ejecuta accidentalmente `git push --force`, GitHub abortará inmediatamente la transacción con el siguiente mensaje de seguridad:
```text
remote: error: GH006: Protected branch update failed for refs/heads/development.
remote: error: Cannot force-push to a protected branch
To https://github.com/nasa-earth-detectives/nasa-earth-trend-detective.git
 ! [remote rejected] development -> development (protected branch hook declined)
```

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
