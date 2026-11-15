# 📝 Registro de Jornada — 2026-11-14: Validación Real 2000–2025, Bilingüe EN/ES, QA y Promoción a Producción

Volver al [[00-Map-Of-Content]] | Sprints: [[04-Sprints-y-Roadmap]] | Trazabilidad Sprint 4: [[19-Trazabilidad-ClickUp-Sprint-4]] | Postulación Oficial: [[35-NASA-Space-Apps-Official-Submission-En]]

---

## 🎯 Resumen Ejecutivo del Día (`2026-11-14`)

Durante la jornada de cierre previo a la entrega oficial del **NASA International Space Apps Challenge 2026 (Neiva — Equipo DB-Runtime)** se consolidaron los últimos entregables técnicos, científicos, de interfaz y de documentación manteniendo trazabilidad estricta en el flujo de 3 ramas (`development` → `qa` → `production`).

---

## 📦 Cambios Integrados y Pull Requests del Día

| PR | Rama Origen → Destino | Alcance Técnico Verificado | Estado CI / Gobernanza |
| :---: | :--- | :--- | :--- |
| **#74** | `chore/ci-300-lines` → `development` | Elevación del umbral de modularidad en `.github/workflows/ci-qa.yml` de 150 a **300 líneas** por archivo (`.ts`, `.tsx`, `.cs`) sin perder cohesión ni permitir clases monolíticas. | Mergeado en `development` |
| **#75** | `feat/frontend-english-ui` → `development` | Estandarización base de toda la UI, etiquetas de procedencia (`REAL NASA DATA 9`), leyendas y unidades al inglés para el jurado global; ajuste del subtítulo orbital. | Mergeado en `development` (`7cec1df`) |
| **#76** | `development` → `qa` | Sincronización de staging QA con `GRACE` / `OCO-2` reales, preblanqueo iterativo, FDR 5 % (`#73`), regla CI de 300 líneas (`#74`) e interfaz base en inglés (`#75`). | Mergeado en `qa` (`4405b55`) |
| **#77** | `feat/real-data-2000-2025-validation` → `development` | Incorporación de `RealSeededTrends2000To2025Tests` (semillas Parquet reales `9/9`) y `LiveNasaApiValidationTests` (contrastación en vivo con GISTEMP v4 y NASA POWER 2000–2025). | CI en verde · `MERGEABLE` · Pendiente 1 aprobación de par |
| **#78** | `docs/sync-clickup-and-obsidian-audit` → `development` | Sincronización de bóveda Obsidian, tarjetas ClickUp (`S4` y `PHYS-T1..T5`), GitHub Project `#1`, guía de envío portal NASA Space Apps (`35`) y este registro diario (`41`). | CI en verde · `MERGEABLE` · Pendiente 1 aprobación de par |
| **#79** | `feat/bilingual-en-es` → `development` | Soporte bilingüe completo **EN \| ES** en cabecera (`MissionHeader`), persistencia en `localStorage` (`nasa_trend_locale`), parámetros compartibles `?lang=en\|es`, limpieza de caracteres UTF-8, corrección de **11 avisos de React Doctor (`0` nuevos issues en `a931757`)** y verificación E2E contra DuckDB `9/9`. | CI en verde (incl. **React Doctor**) · `MERGEABLE` · Pendiente 1 aprobación de par |
| **#80** | `qa` → `production` | Pull Request oficial de promoción hacia `production` con la base estabilizada en `qa` (y paso previo antes de promover el lote `#77`–`#79`). | Checks de PR en verde · **React Doctor: 0 issues** · Pendiente 1 aprobación de par |

---

## 🧪 Evidencia de Validación Bilingüe (`#79`) y Entorno Local

1. **Calidad y Refactorización React Doctor (`a931757`):**
   - Formateadores `Intl.NumberFormat` cacheados a nivel de módulo en `frontend/src/i18n/format.ts` (`js-hoist-intl` resuelto en `OpposingCaseCell`, `TrendMethods`, `TrendSignificanceBadge`, `HexReadout`, `HexSignificance` y `helpers`).
   - Extracción de `useI18n` y `I18nContext` a `frontend/src/i18n/useI18n.ts` dejando únicamente el componente `LanguageProvider` exportado en `I18nContext.tsx` (`only-export-components` resuelto).
2. **Validación E2E Headless (Vite + API .NET DuckDB `9/9 observed`):**
   - **Desktop (`1440 px`) y Móvil (`390 px`):** cambio de idioma instantáneo sin desbordamiento horizontal (`scrollW === innerW`), sin solapamientos en cabecera, `0` errores de consola, `0` respuestas HTTP `>= 400` y `0` secuencias corruptas (mojibake).
   - **Cifras localizadas y en vivo verificadas en español:** Casos Opuestos (`+0,585°C por década`, `p = 0,015`), Inspector (`+0,0502 a +0,0703 °C / año`, `r₁ = 0,39`) y Glosario (`6` términos sin advertencia obsoleta).
3. **Compilación y Validadores:**
   - `type-check` en `packages/shared` y `frontend`, `vite build` y `dotnet build -c Release -warnaserror` (`0` errores / `0` advertencias) en verde.
   - Los 6 validadores del globo/física en `scripts/` (`validate-earth-heat`, `validate-earth-hex`, `validate-earth-lighting`, `validate-hex-picking`, `validate-observation-lookup`, `validate-solar-position`) ejecutados con resultado `PASS`.

---

## ⚠️ Puntos Operativos Detectados para el Cierre (`2026-11-15`)

1. **Aprobaciones por Ruleset `23708910`:** al ser `brayancortes22` el autor de `#77`, `#78`, `#79` y `#80`, GitHub bloquea la autoaprobación; se requiere **1 aprobación de un compañero** (`@July173`, `@emilsecc`, `@DiegoArias32` o `@reivyng`) en cada PR siguiendo el orden `#77`, `#78`, `#79` → nuevo PR `development` a `qa` → `#80` (o promover `#80` primero y luego el lote `#77`–`#79`).
2. **Espejo automático a Vercel ([mirror-to-personal.yml](../../.github/workflows/mirror-to-personal.yml)):** el run `43661505111` en `qa` falló en `actions/checkout` usando `PERSONAL_REPO_SYNC_TOKEN` (`fatal: could not read Username for 'https://github.com'`). Aunque el secreto existe en GitHub Actions, requiere **regeneración/permisos vigentes** para que el merge a `production` dispare automáticamente Vercel.

---

## 🛠️ Corrección Crítica de Memoria en Render Free Tier (`fix/render-memory-limit`)

Durante el despliegue de `nasa-trend-detective-api` en Render (`512 MB` RAM), la API sufrió reinicios OOM durante la ingesta inicial de `gistemp_v4.parquet` (`5.14 M` filas) y bajo tráfico consecutivo de `/api/trends/grid`.

### Diagnóstico raíz verificado
1. **Pérdida de límites en DuckDB en modo archivo (`DuckDbConnectionFactory`):** al cerrar la primera conexión (`DuckDbSchemaHostedService`), `_memoryAnchor` permanecía `null` en modo archivo (`DUCKDB_DATABASE_PATH`), por lo que DuckDB cerraba la instancia configurada y todas las conexiones posteriores (`DatasetSeedHostedService` y consultas HTTP) abrían una instancia nueva sin límites (`80%` de RAM física del host y todos los hilos).
2. **Acumulación de memoria nativa y administrada:** `IMemoryCache` sin `SizeLimit`, materialización completa de filas en `GridTrendRepository` antes de agrupar en memoria, ausencia de `CHECKPOINT` tras cada dataset importado, `ANTI JOIN` global sin acotar por variable cuando la tabla ya contenía datos, y configuración Server GC sin tope en contenedor.

### Cambios aplicados y validación local
- **Persistencia real de límites en DuckDB (`DuckDbConnectionFactory` + test en `DuckDbResourceLimitTests`):** ancla de conexión en modo archivo (`_fileAnchor`) con sincronización thread-safe y `SET preserve_insertion_order = false` cuando hay límites activos, verificando en prueba automatizada que una segunda conexión mantiene `memory_limit`, `threads = 1` y `preserve_insertion_order = false`.
- **Ingesta y consultas acotadas:** `CHECKPOINT` posterior a cada dataset importado (`DatasetSeeder`), verificación condicional de duplicados acotada por `variable_id` (`ParquetImportSql` / `ParquetIngestion`), streaming directo de filas en `GridTrendRepository` vía `StreamQueryAsync`, caché acotada (`SizeLimit = 64` en `Program.cs` y entradas con tamaño/expiración en `TrendsController`), cancelación limpia `499` en `ExceptionHandlingMiddleware` y ajustes en `backend/Dockerfile` (`DOTNET_gcServer=0`, `DOTNET_GCConserveMemory=9`, `DOTNET_GCHeapHardLimit=0x8000000`, `MALLOC_ARENA_MAX=2`, `DuckDb__MemoryLimit=110MB`, `DuckDb__Threads=1`).
- **Resultados medidos:**
  - `dotnet build backend/NasaTrendDetective.slnx -c Release -warnaserror`: `0` advertencias, `0` errores.
  - `dotnet test backend/NasaTrendDetective.slnx -c Release --filter "Category!=LiveNasaApi"`: **`210/210` pruebas en verde** (incluidas `RealSeededTrends2000To2025Tests` y `ParquetImporterTests`).
  - **Perfilado Release local (con las variables de `backend/Dockerfile`):** pico inicial durante sembrado GISTEMP reducido de `619.7 MB` WS (`598.1 MB` privados) a **`389.9 MB` PeakWS** (`369.6 MB` máx. muestreado), sembrado completo `9/9` (`10 M` filas) en `53.7 s`, y estabilidad entre **`176.2–232.0 MB` WS** tras consultar los `9` grids (`/api/trends/grid`), observaciones, punto individual, `/api/trends/opposing` y ráfaga concurrente de 4 peticiones (`200 OK`).

---

## 🚀 Despliegue en Render (`a7c6469`), Corrección UI Responsiva y Sincronización Project #1

### 1. Promoción y Verificación en Producción (Render + Vercel Mirror)
- **PR `#82` (`48aa06d` → `36823fa`), PR `#83` (`fbeb0e8` en `qa`), PR `#84` (`a7c6469` en `production`):** flujo completo validado en CI + Docker Build, y ramas `development`, `qa`, `production` y `main` sincronizadas en el remoto `personal` (`brayancortes22/nasa-earth-trend-detective`).
- **Smoke tests en vivo (`https://nasa-trend-detective-api-72rq.onrender.com`):**
  - `/health`: `200 OK` (`444 ms`)
  - `/api/datasets`: `200 OK` (`281 ms`, `9/9` datasets `observed`)
  - `/api/trends`: `200 OK` (`Gistemp` `2000–2025`, Mann-Kendall/Sen + preblanqueamiento + regresión lineal)
  - `/api/trends/opposing`: `200 OK` (`1279 ms`, `4` pares dinámicos reales MERRA-2)
  - `/api/trends/grid`: `Oco2` (`200 OK`, `2227 ms`, `3,139` celdas), `Gistemp` (`200 OK`, `2554 ms`, `16,021` celdas) y `Merra2Temperature` (`200 OK`, `2746 ms`, `16,200` celdas). *(Nota: [Program.cs](../../backend/src/NasaTrendDetective.Api/Program.cs) expone controladores REST JSON directos sin middleware de UI Swagger en tiempo de ejecución).*

### 2. Corrección de Solapamiento Vertical y Tableta en UI (`fix/ui-readout-overlap`)
- **Causa raíz:** `.observation-position` (`top: clamp(130px, 16vh, 200px)`) y `.system-position` (`bottom: 38px`) se posicionaban de forma independiente en escritorio, montándose `.system-position` sobre `Fuente` / `Unidad` en alturas de portátil (`~720 px`) y en modo tendencia; además, en tableta (`601–820 px`) `.mission-signature` pasaba a columna (~`117 px` de alto) mientras `.observation-position` permanecía en `top: 86px`.
- **Solución:**
  - En [ImmersiveEarthLayout.tsx](../../frontend/src/components/Layout/ImmersiveEarthLayout.tsx) y [workspace.css](../../frontend/src/styles/workspace.css): agrupación en `.workspace-left-rail` como columna flex vertical (`>= 1024px`) con `justify-content: space-between` (`display: contents` en `<= 1023px` para preservar tableta/móvil) y ajuste `.observation-position { top: 148px }` en `601–960 px`.
  - En [instrument-chrome.css](../../frontend/src/styles/instrument-chrome.css) y [hex-instrument.css](../../frontend/src/styles/hex-instrument.css): compactación progresiva por altura (`max-height: 860px / 750px / 660px`) y apilamiento temprano de `.mission-signature` (`<= 960 px`).
- **Verificación headless en Chromium contra API viva de Render:** `1280x720` anual ES con celda seleccionada (`116 px` de separación), `1280x720` tendencia ES con celda seleccionada (`190 px` de separación), `1440x900` tendencia ES y anual EN, `768x1024` tableta ES (`15 px` libres bajo `.mission-position`) y `390x844` móvil ES: **`0` solapamientos**, **`0` recortes**, **`0` errores de consola** y **`0` errores HTTP**, más `type-check` y validadores locales en verde.

### 3. Sincronización de Tareas y Tablero en GitHub Project `#1`
- **Cerrada y movida a `Done`:** Issue `#65` (`[S4-T7]`) tras validar el despliegue estable y los endpoints reales en Render.
- **Actualizada a `Review`:** Issue `#61` (`[S4-T4]`, pendiente solo la auditoría de 60 FPS WebGL y capturas 1080p para las 7 diapositivas).
- **Actualizadas en curso:** Issues `#62` (`[S4-T5]`) y `#70` (`[PHYS-T5]`) con el estado real de producción.
- **Estado previo completado:** **PR `#87`** (`qa` → `production`) fusionado (`8e63326`), espejo personal actualizado y verificación en vivo de Vercel (`200 OK`) y Render (`/api/datasets` y `/api/trends` `200 OK`).

---

## ⚡ Consolidación del Pipeline CI/CD (`chore/streamline-ci-cd-workflows`)

### Diagnóstico de duplicidad y cuellos de botella previos (7 workflows)
1. **Doble ejecución `(push)` + `(pull_request)`:** `ci-qa.yml` y `verify-authorship.yml` corrían dos veces sobre los mismos commits en promociones `development` → `qa` → `production`.
2. **Revisor duplicado:** `ai-pr-reviewer.yml` y `copilot-pr-governance.yml` invocaban ambos `ai-pr-reviewer.mjs` sobre el mismo PR, duplicando comentarios idénticos (`PR #85`).
3. **Builds innecesarios y jobs sin acción real:** `Docker Build Validation` (`push: false`), `Backend (.NET 10)` sin caché de NuGet y `Frontend Build` corrían incluso en PRs exclusivos de documentación o del stack opuesto; `deploy-qa` y `production-gate` solo ejecutaban `echo`.
4. **Fallas automáticas y consumo en repo espejo privado:** `mirror-to-personal.yml` pasaba `PERSONAL_REPO_SYNC_TOKEN` a `actions/checkout@v4` contra el repo de la organización (fallando con `fatal: could not read Username`), `auto-sync-dev-to-qa.yml` disparaba corridas rotas de `0 jobs` al abrir PRs como `github-actions[bot]`, y ningún workflow filtraba `github.repository_owner == 'nasa-earth-detectives'`, consumiendo minutos en `brayancortes22/nasa-earth-trend-detective` (`PRIVATE`).

### Nueva arquitectura consolidada (3 workflows + `.github/scripts/ai-pr-reviewer.mjs`)
- **[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml):** reemplaza `ci-qa.yml` y `react-doctor.yml` en `pull_request` + `workflow_dispatch`; agrega job `changes` por rutas (`frontend`, `backend`, `docker_backend`, `docker_frontend`), caché NuGet (`~/.nuget/packages`), integra `millionco/react-doctor@v2` dentro del job `frontend` y restringe Docker builds a cambios de `Dockerfile`/dependencias/compose o paso a `production`.
- **[`.github/workflows/pr-governance.yml`](../../.github/workflows/pr-governance.yml):** unifica `verify-authorship.yml`, `ai-pr-reviewer.yml` y `copilot-pr-governance.yml` en `authorship-and-rules` (regla `qa` → `production`, autoría limpia y límite `<= 300` líneas sin instalar Node) + `pr-audit` (one-shot y `/copilot-review` sobre el `head_sha` real del PR).
- **[`.github/workflows/mirror-to-personal.yml`](../../.github/workflows/mirror-to-personal.yml):** guarda `github.repository_owner == 'nasa-earth-detectives'`, checkout con `persist-credentials: false` usando token de lectura de la org y uso exclusivo de `PERSONAL_REPO_SYNC_TOKEN` vía header transitorio para el `git push` al repo personal.
- **[`.github/scripts/ai-pr-reviewer.mjs`](../../.github/scripts/ai-pr-reviewer.mjs):** usa `execFileSync` y actualiza en sitio el comentario único (`<!-- nasa-pr-reviewer -->`) mediante `PATCH`/`POST`.
