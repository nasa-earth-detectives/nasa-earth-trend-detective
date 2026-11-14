# 🏛️ Gobernanza del Repositorio: Organización, Projects y Rulesets

Volver al [[00-Map-Of-Content]] | [[02-Estrategia-Git-3-Ramas]]

---

## 👥 1. Organización Oficial en GitHub

El monorrepo está alojado oficialmente en la **Organización de GitHub**:
👉 **URL de la Organización:** [https://github.com/nasa-earth-detectives](https://github.com/nasa-earth-detectives)  
👉 **Repositorio Oficial:** [https://github.com/nasa-earth-detectives/nasa-earth-trend-detective](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective)

### Distribución de Roles para los 6 Participantes:
- **Owner / Administrador:** Brayan Stid Cortés (`@brayancortes22`).
- **Members & Colaboradores (5 Integrantes):** Daniela Ramos / July (`@July173`, invitación de org pendiente por aceptar), Fabriany Medina / Reving (`@reivyng`), Johan Sebastian Olaya (`@JohanSebastianOlayaReyes`), Emilse Cabrera (`@emilsecc`) y Diego Arias (`@DiegoArias32`).
- **Equipos en GitHub Organization (Teams) vinculados a Project #1:**
  - [developers](https://github.com/orgs/nasa-earth-detectives/teams/developers): Acceso base de equipo al monorrepo y al tablero oficial (`@brayancortes22`, `@DiegoArias32`, `@reivyng`, `@emilsecc`, invitación `@July173`).
  - [backend-team](https://github.com/orgs/nasa-earth-detectives/teams/backend-team): Núcleo Backend, ETL, Ciencia de Datos y Física & QA (`@reivyng`, `@emilsecc`, `@brayancortes22`, invitación `@July173`).
  - [frontend-team](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team): Revisores `CODEOWNERS` de UI/UX, React 19, Componentes y WebGL 3D (`@brayancortes22`, `@DiegoArias32`).

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

## 📋 3. Tablero de Gestión: GitHub Projects, Issues y Milestones

👉 **Tablero Kanban Oficial:** [https://github.com/orgs/nasa-earth-detectives/projects/1](https://github.com/orgs/nasa-earth-detectives/projects/1)  
👉 **Vínculos Activos:** Enlazado oficialmente al repositorio `nasa-earth-detectives/nasa-earth-trend-detective` y a los equipos [`frontend-team`](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team/projects), [`backend-team`](https://github.com/orgs/nasa-earth-detectives/teams/backend-team/projects) y [`developers`](https://github.com/orgs/nasa-earth-detectives/teams/developers/projects).

Columnas configuradas en el campo **Status** para los 4 Sprints y el módulo de Física & QA:
1. **Backlog:** Ideas, requerimientos futuros y datasets NASA/CSA adicionales.
2. **To Do:** Tareas atómicas priorizadas del sprint o módulo activo (`#59` S4-T2, `#62` S4-T5, `#64` S4-T6, `#65` S4-T7, `#66`–`#70` PHYS-T1..T5).
3. **In Progress:** Tareas en desarrollo activo (`#61` `[S4-T4]` a cargo de `@DiegoArias32`).
4. **Review:** Pendiente de QA físico, pruebas integrales o revisión `CODEOWNERS` en Pull Request.
5. **Done:** Tareas entregadas, verificadas y cerradas (`#42`–`#58`, `#60`, `#63` — Sprints 1–3, S4-T1, S4-T3 y S4-T5 Extra).

### Vistas, Campos Personalizados y Milestones Sincronizados con ClickUp
- **Campos personalizados en Project #1:** `Sprint`, `Equipo` (`Frontend & 3D`, `Backend & API`, `Datos & ETL`, `Ciencia de Datos`, `Física & QA`, `Equipo Completo`), `Responsable`, `Prioridad`, `Código ClickUp` y `Horas`.
- **Vistas configuradas:** `Lista General (ClickUp)`, `Tablero Kanban`, `Sprint 4 · Hackathon Neiva`, `Frontend Team`, `Física & QA (Emilse)` y `Backend, Datos & Ciencia`.
- **Milestones del repositorio:** `#1 Sprint 1` (cerrado), `#2 Sprint 2` (cerrado), `#3 Sprint 3` (cerrado), `#4 Sprint 4: Hackathon Neiva, Datos Reales y Entrega NASA` (abierto) y `#5 Física Climática, Dinámica Atmosférica y QA` (abierto).
- **Total de Issues sincronizados 1:1 con ClickUp:** **29 Issues** (`#42`–`#70`: 19 cerrados en `Done`, 1 abierto en `In Progress`, 9 abiertos en `To Do`), cada uno con el checklist completo de sus subtareas y enlaces directos a ClickUp.

---

## 🛡️ 4. Blindaje y Pauta Anti-IA para el Jurado de la NASA
- **Regla Estricta:** No conectar extensiones, bots visibles ni aplicaciones externas de IA al repositorio en GitHub.
- Los metadatos de GitHub, descripciones de Issues, PRs y commits son 100% técnicos y redactados por el equipo, demostrando dominio pleno del dominio biofísico y arquitectónico ante el jurado calificador de la NASA.
