# 🚀 Pipeline de Integración y Entrega Continua (CI/CD)

Volver al [[00-Map-Of-Content]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🛡️ Arquitectura Consolidada (3 Workflows Sin Duplicidad)

El pipeline en `.github/workflows/` fue consolidado de 7 archivos redundantes a **3 workflows especializados** protegidos por `github.repository_owner == 'nasa-earth-detectives'` (evitando ejecuciones y consumos innecesarios en el espejo privado de Vercel):

### 🔄 Workflows Activos

1. **Integración Continua Selectiva ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)):**
   - Se ejecuta únicamente en `pull_request` hacia `development`, `qa` y `production` (y bajo demanda con `workflow_dispatch`), eliminando ejecuciones duplicadas `(push)` + `(pull_request)`.
   - **Detección de cambios (`changes`):**
     - `frontend`: `npm ci`, `type-check` en `shared` y `frontend`, `vite build` y auditoría **React Doctor (`millionco/react-doctor@v2`)** solo cuando cambian `frontend/**`, `packages/shared/**` o `package*.json`. Ver [[20-Auditoria-React-Doctor]].
     - `backend`: compilación Release (`-warnaserror`), caché de `~/.nuget/packages` y pruebas científicas `.NET 10` (`Category!=LiveNasaApi`) solo cuando cambia `backend/**`.
     - `docker`: `docker compose config -q` y build de imágenes solo cuando cambian Dockerfiles, `.csproj`/`.slnx`, `package*.json`, `ci.yml` o en promociones hacia `production`.

2. **Gobernanza, Autoría Limpia y Revisión PR ([`.github/workflows/pr-governance.yml`](../../.github/workflows/pr-governance.yml)):**
   - Consolida los antiguos flujos de autoría humana, reglas de Copilot y agente revisor en una sola ejecución rápida por PR.
   - **`authorship-and-rules`:** verifica que todo PR a `production` provenga de `qa`, valida mensajes de commits/PR sin trailers de IA y aplica el límite de modularidad (`<= 300` líneas en `.ts`, `.tsx`, `.cs`).
   - **`pr-audit`:** ejecuta `.github/scripts/ai-pr-reviewer.mjs` al abrir (`opened`), pasar a listo (`ready_for_review`), etiquetar (`copilot-review`) o comentar `/copilot-review`, actualizando un único comentario (`<!-- nasa-pr-reviewer -->`) sin duplicados. Ver [[14-Agente-Revisor-PR-GitHub-Actions]] y [[25-Gobernanza-y-Revision-con-GitHub-Copilot]].

3. **Espejo Automático hacia Vercel ([`.github/workflows/mirror-to-personal.yml`](../../.github/workflows/mirror-to-personal.yml)):**
   - Se ejecuta únicamente tras `push`/merge en `development`, `qa` o `production` dentro de la organización.
   - Realiza checkout con `persist-credentials: false` (token de lectura de la org) y autentica con `PERSONAL_REPO_SYNC_TOKEN` exclusivamente para empujar la rama hacia `brayancortes22/nasa-earth-trend-detective` (incluyendo el alias `main` en `production`) para disparar el auto-deploy en Vercel.

---

## 🛑 Promoción hacia `qa` y `production`
- Las ramas protegidas (`development`, `qa`, `production`) mantienen activo el ruleset `Strict Shield` (requieren Pull Request).
- La promoción `qa` ➔ `production` requiere aprobación explícita del equipo y pasa una validación final limpia sin workflows repetidos ni jobs falsos (`echo`).
