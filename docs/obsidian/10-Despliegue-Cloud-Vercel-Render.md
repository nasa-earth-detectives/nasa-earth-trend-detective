# ☁️ Despliegue en la Nube: Vercel (Frontend) y Render (Backend)

Volver al [[00-Map-Of-Content]] | Ver contenedores en [[08-Contenedores-Docker]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🌐 Entornos de Despliegue y URLs Oficiales (Verificadas)

| Entorno | Componente | Rama Git | Plataforma Cloud | URL Pública Permanente | Tipo de Enlace | Estado |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **Producción Oficial** | **Frontend Web 3D** | `production` | **Vercel Edge** | [https://nasa-earth-trend-detective.vercel.app/](https://nasa-earth-trend-detective.vercel.app/) | Dominio Canónico Producción | 🟢 200 OK |
| **QA (Staging)** | **Frontend Web 3D** | `qa` | **Vercel Edge** | [https://nasa-earth-trend-detective-qa.vercel.app/](https://nasa-earth-trend-detective-qa.vercel.app/) | Dominio Fijo QA | 🟢 200 OK |
| **Development** | **Frontend Web 3D** | `development` | **Vercel Edge** | [https://nasa-earth-trend-detective-dev.vercel.app/](https://nasa-earth-trend-detective-dev.vercel.app/) | Dominio Fijo Development | 🟢 200 OK |
| **Producción** | **Backend REST API** | `production` | **Render Cloud** | [https://nasa-trend-detective-api.onrender.com](https://nasa-trend-detective-api.onrender.com) | Render Web Service | 🟢 200 OK |
| **Producción** | **Health Check API** | `production` | **Render Cloud** | [https://nasa-trend-detective-api.onrender.com/health](https://nasa-trend-detective-api.onrender.com/health) | Health Monitor | 🟢 200 OK |

> 📌 **Garantía de Enlaces Fijos Permanentes (Sin Hashes ni Cambios):**
> - **URLs Inmutables:** Los tres enlaces de Vercel anteriores son **dominios asignados directamente por rama**. Nunca cambian, nunca rotan y no contienen códigos temporales.
> - **Actualización Automática:** Cada `git push` o merge a `development`, `qa` o `production` despliega automáticamente sobre su respectiva URL fija en menos de 25 segundos.

---

## 🎯 1. Arquitectura de Despliegue Serverless & Contenedor

La arquitectura de producción está distribuida para obtener máxima velocidad global en CDN y procesamiento analítico de alta densidad:

```text
[ Usuario / Jurado NASA ]
           │
           ▼
  [ Vercel Edge CDN ] ──── (Frontend React 19 + Three.js / Globe.gl)
           │
           │ HTTPS / REST (DuckDB Queries)
           ▼
  [ Render Web Service ] ── (Backend .NET 10 Container + DuckDB Engine)
           │
           ▼
  [ NASA Satellite Datasets ] (GISTEMP, MODIS, GRACE-FO, OCO-2)
```

---

## ⚡ 2. Frontend en Vercel (React 19 + Vite)

### Configuración Automática (`vercel.json`)
El monorrepo cuenta con `vercel.json` en la raíz y en `frontend/vercel.json` con:
- **Framework Preset:** Vite
- **Comando de Compilación:** `npm run build --workspace=frontend`
- **Directorio de Salida:** `frontend/dist`
- **SPA Fallback Routing:** Redirección de todas las rutas (`/(.*)`) hacia `/index.html` para evitar errores 404 en recargas.
- **Proxy API:** Redirección de `/api/(.*)` hacia el backend en Render.

### Pasos para Activar en Vercel (1 Clic):
1. Ingresar a [Vercel Dashboard](https://vercel.com/new).
2. Seleccionar la Organización **`nasa-earth-detectives`** y el repositorio **`nasa-earth-trend-detective`**.
3. **Rama de Producción:** Seleccionará automáticamente **`production`** (configurada como predeterminada).
4. En **Environment Variables**, agregar (opcional si se usa proxy):
   - `VITE_API_URL`: `https://nasa-trend-detective-api.onrender.com/api`
5. Clic en **Deploy**.

---

## 🐳 3. Backend en Render (.NET 10 + DuckDB)

### Infraestructura como Código (`render.yaml`)
El archivo `render.yaml` define la especificación completa del servicio web:
- **Runtime:** Docker (`backend/Dockerfile` multi-stage ligero en Alpine).
- **Plan:** Free (`plan: free`).
- **Rama:** `production`.
- **Health Check:** `/health` (Responde 200 OK con metadatos del servicio).
- **Puerto Dinámico:** El backend lee la variable `$PORT` inyectada por Render y se enlaza automáticamente.

### Pasos para Activar en Render:
1. Ingresar a [Render Dashboard](https://dashboard.render.com).
2. Clic en **New +** -> **Blueprint**.
3. Conectar el repositorio **`nasa-earth-detectives/nasa-earth-trend-detective`**.
4. Render detectará automáticamente `render.yaml` y preconfigurará el servicio `nasa-trend-detective-api`.
5. Clic en **Apply**.

---

## 🔒 4. Variables de Entorno y Seguridad Perimetral

| Servicio | Variable | Valor Recomendado | Propósito |
| :--- | :--- | :--- | :--- |
| **Vercel** | `VITE_API_URL` | `https://nasa-trend-detective-api.onrender.com/api` | Enlace directo al backend en Render |
| **Render** | `ASPNETCORE_ENVIRONMENT` | `Production` | Activa optimizaciones de producción en .NET |
| **Render** | `RateLimiting__GlobalPermitLimit` | `300` | Límite de 300 peticiones/minuto por IP |
| **Render** | `RateLimiting__HeavyAnalysisPermitLimit` | `60` | Límite de 60 peticiones/minuto para cálculos pesados |
| **Render** | `RateLimiting__WindowSeconds` | `60` | Ventana temporal de evaluación |
| **Render** | `RateLimiting__RequestTimeoutSeconds` | `15` | Mitigación anti-slowloris |

---

## 🚀 5. Flujo de Despliegue Continuo (CI/CD) y Dominios Fijos por Rama
 
| Rama Git | Entorno en Vercel | Dominio Fijo Permanente | Propósito y Acceso |
| :--- | :--- | :--- | :--- |
| **`production`** ⭐ | 🔵 **`Production`** | [https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app) | **Evaluación Jurado NASA:** Versión final y estable. |
| **`qa`** | 🟡 **`Preview (QA)`** | [https://nasa-earth-trend-detective-qa.vercel.app](https://nasa-earth-trend-detective-qa.vercel.app) | **Staging / QA:** Pruebas integrales de equipo antes de producción. |
| **`development`** | 🟣 **`Preview (Dev)`** | [https://nasa-earth-trend-detective-dev.vercel.app](https://nasa-earth-trend-detective-dev.vercel.app) | **Desarrollo Activo:** Revisión de nuevas características en tiempo real. |

> 💡 **Cero Fricción para el Equipo:** Ya no es necesario buscar el link temporal de cada commit en el dashboard de Vercel. Cada rama tiene su dirección web fija y única que se sobreescribe y actualiza de manera continua.

---

## 🏆 6. Registro de Releases Oficiales en Producción

### Release v1.0.0-rc1 (23 de Septiembre de 2026)
- **Pull Request Oficial:** [PR #17 (qa ➔ production)](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective/pull/17) — **MERGED 🟢**
- **Commit en Producción:** `181aab1`
- **Módulos Integrados y Certificados:**
  1. **🌍 [S1-T4] Experiencia Orbital 3D NASA:** Texturas satelitales diurnas Blue Marble (2K/4K/8K) con capa nubosa dinámica y visión nocturna Black Marble 2016, shaders de dispersión atmosférica Rayleigh/Mie y 60 FPS estables.
  2. **🎛️ [S3-T5] Time-Slider Interactivo Multidecenal (2000-2026):** Rango de 27 años, controles de reproducción multivelocidad (`1x`, `2x`, `5x`), modo bucle continuo y 9 balizas de hitos climáticos históricos con tooltips descriptivos.
  3. **🕵️ [S2-T5] Tarjeta Flotante Detective Climático:** Telemetría de coordenadas, badge de significancia Mann-Kendall y gráfica interactiva de tendencias temporales.
  4. **🛰️ [S1-T5] Design System Espacial y Tour Guiado:** Paleta HSL Deep Space, selector de capas de observación satelital y tour guiado con Driver.js.
  5. **🛡️ Seguridad & CI/CD:** Auditoría automática por Agente de IA, contenedor Docker validado y protección perimetral sin bloqueo SSO para acceso público inmediato.
- **Estado de Producción:** 🟢 `https://nasa-earth-trend-detective.vercel.app` (200 OK — Público).

