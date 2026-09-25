# 🚀 Pipeline de Integración y Entrega Continua (CI/CD)

Volver al [[00-Map-Of-Content]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🛡️ Flujo Automatizado con Freno Estricto en QA

El pipeline de GitHub Actions (`.github/workflows/ci-qa.yml`) asegura que cada contribución al monorrepo sea analizada y probada rigurosamente.

### 🔄 Flujos y Workflows Activos:

1. **Revisión Inteligente de PRs (`ai-pr-reviewer.yml`):**
   - Agente autónomo con IA que analiza diffs de código, audita estándares de monorrepo, detecta posibles bugs y publica revisiones detalladas en GitHub.

2. **Pipeline de Integración Continua (`ci-qa.yml`):**
   - **Quality & Linting Gate:** Chequeo estricto de tipos (`tsc --noEmit`) y cumplimiento del límite de líneas por archivo.
   - **Backend Build & Testing (.NET 10):** Compilación Release y pruebas unitarias científicas.
   - **Frontend Build (React 19):** Compilación del bundle con Vite y verificación de librerías WebGL.
   - **Docker Validation:** Validación de builds multi-stage para backend y frontend.

3. **Sincronización Continua `development` ➔ `qa` (`auto-sync-dev-to-qa.yml`):**
   - Detecta cada `push` o `merge` en `development`.
   - Crea y gestiona el Pull Request consolidado de sincronización hacia `qa`.
   - Dispara de inmediato el despliegue automático hacia el entorno de Staging (QA).

4. **Auditoría de Frontend con React Doctor (`react-doctor.yml`):**
   - Motor de análisis estático basado en Rust (Oxlint) creado por Million.js.
   - Audita automáticamente el `diff` de React 19 en cada PR, reporta el *Health Score* (0 a 100) y detecta anti-patrones de rendimiento, accesibilidad y ciclo de vida de hooks. Ver [[20-Auditoria-React-Doctor]].

5. **Espejo Automático a Repositorio Personal (`mirror-to-personal.yml`):**
   - Se ejecuta en cada `push` o `merge` a `development`, `qa` o `production` en la organización.
   - Replica la rama hacia `brayancortes22/nasa-earth-trend-detective` usando el secreto `PERSONAL_REPO_SYNC_TOKEN`.
   - Dispara de forma 100% autónoma los despliegues de Vercel en la nube sin intervención manual.

6. **🛑 Bloqueo Estricto de Producción (`production-gate`):**
   - **PROHIBIDO el pase automático a producción.**
   - La promoción hacia la rama `production` requiere Pull Request manual y aprobación explícita del equipo (*Manual Approval Gate*) para proteger la demo en vivo ante los evaluadores de la NASA.

