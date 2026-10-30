# ☁️ Despliegue en la Nube: Vercel (Frontend) y Render (Backend)

Volver al [[00-Map-Of-Content]] | Ver contenedores en [[08-Contenedores-Docker]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🌐 Entornos de Despliegue y URLs Oficiales (Verificadas)

| Entorno | Componente | Rama Git | Plataforma Cloud | URL Pública Permanente | Tipo de Enlace | Estado |
| :--- | :--- | :---: | :--- | :--- | :--- | :---: |
| **Producción Oficial** | **Frontend Web 3D** | `production` | **Vercel Edge** | [https://nasa-earth-trend-detective.vercel.app/](https://nasa-earth-trend-detective.vercel.app/) | Dominio Canónico Producción | 🟢 200 OK |
| **QA (Staging)** | **Frontend Web 3D** | `qa` | **Vercel Edge** | [https://nasa-earth-trend-detective-qa.vercel.app/](https://nasa-earth-trend-detective-qa.vercel.app/) | Dominio Fijo QA | 🟢 200 OK |
| **Development** | **Frontend Web 3D** | `development` | **Vercel Edge** | [https://nasa-earth-trend-detective-dev.vercel.app/](https://nasa-earth-trend-detective-dev.vercel.app/) | Dominio Fijo Development | 🟢 200 OK |
| **Producción** | **Backend REST API** | `production` | **Render Cloud** | [https://nasa-trend-detective-api-72rq.onrender.com](https://nasa-trend-detective-api-72rq.onrender.com) | Render Web Service Activo | 🟢 200 OK |
| **Producción** | **Health Check API** | `production` | **Render Cloud** | [https://nasa-trend-detective-api-72rq.onrender.com/health](https://nasa-trend-detective-api-72rq.onrender.com/health) | Health Monitor | 🟢 200 OK |
| **Producción** | **Catálogo Datasets** | `production` | **Render Cloud** | [https://nasa-trend-detective-api-72rq.onrender.com/api/datasets](https://nasa-trend-detective-api-72rq.onrender.com/api/datasets) | Catálogo Transparente | 🟢 200 OK |

> 📌 **Garantía de Enlaces Fijos Permanentes (Sin Hashes ni Cambios):**
> - **URLs Inmutables:** Los tres enlaces de Vercel anteriores son **dominios asignados directamente por rama**. Nunca cambian, nunca rotan y no contienen códigos temporales.
> - **Backend en Render:** El servicio `nasa-trend-detective-api-72rq` está desplegado en la cuenta activa del equipo (`bscl20062007@gmail.com`), optimizado con DuckDB columnar embebido y proxy inverso Vercel.

---

## 🎯 1. Arquitectura de Despliegue Serverless & Contenedor

La arquitectura de producción está distribuida para obtener máxima velocidad global en CDN y procesamiento analítico de alta densidad:

```text
[ Usuario / Jurado NASA ]
           │
           ▼
  [ Vercel Edge CDN ] ──── (Frontend React 19 + Three.js / Globe.gl)
           │
           │ HTTPS / REST (DuckDB Queries vía /api/*)
           ▼
  [ Render Web Service ] ── (Backend .NET 10 Container + DuckDB Engine)
           │
           ▼
  [ NASA Satellite Datasets ] (GISTEMP v4 Real, MODIS, GRACE-FO, OCO-2)
```

---

## ⚡ 2. Frontend en Vercel (React 19 + Vite)

### Configuración Automática (`vercel.json`)
El monorrepo cuenta con `vercel.json` en la raíz y en `frontend/vercel.json` con:
- **Framework Preset:** Vite
- **Comando de Compilación:** `npm run build --workspace=frontend`
- **Directorio de Salida:** `frontend/dist`
- **SPA Fallback Routing:** Redirección de todas las rutas (`/(.*)`) hacia `/index.html` para evitar errores 404 en recargas.
- **Proxy API:** Redirección de `/api/(.*)` hacia `https://nasa-trend-detective-api-72rq.onrender.com/api/$1`.

### Variables de Entorno en Vercel:
- `VITE_API_URL`: `https://nasa-trend-detective-api-72rq.onrender.com/api`

---

## 🐳 3. Backend en Render (.NET 10 + DuckDB)

### Especificación del Servicio:
- **Service ID:** `srv-dbihrhnf3r2c73bej43g`
- **Owner ID:** `tea-dbgfu6t9fdbs73df80q0` (`bscl20062007@gmail.com`)
- **Runtime:** Docker (`backend/Dockerfile` multi-stage optimizado).
- **Docker Context:** `./backend`
- **Plan:** Free (`plan: free`).
- **Health Check Path:** `/health` (Responde 200 OK: `{ "status": "Healthy", "service": "NasaTrendDetective.Api" }`).

---

## 🔒 4. Variables de Entorno y Seguridad Perimetral

| Servicio | Variable | Valor Configurado | Propósito |
| :--- | :--- | :--- | :--- |
| **Vercel** | `VITE_API_URL` | `https://nasa-trend-detective-api-72rq.onrender.com/api` | Enlace directo al backend en Render |
| **Render** | `ASPNETCORE_ENVIRONMENT` | `Production` | Activa optimizaciones de producción en .NET |
| **Render** | `RateLimiting__GlobalPermitLimit` | `300` | Límite de 300 peticiones/minuto por IP |
| **Render** | `RateLimiting__HeavyAnalysisPermitLimit` | `60` | Límite de 60 peticiones/minuto para cálculos pesados |
| **Render** | `RateLimiting__WindowSeconds` | `60` | Ventana temporal de evaluación |
| **Render** | `RateLimiting__RequestTimeoutSeconds` | `15` | Mitigación anti-slowloris |

---

## 🏆 5. Registro de Releases Oficiales en Producción

### Release v1.2.1 — Estabilidad, Usabilidad y Despliegue Activo (Octubre 2026)
- **Frontend Vercel:** `https://nasa-earth-trend-detective.vercel.app` (200 OK)
- **Backend Render:** `https://nasa-trend-detective-api-72rq.onrender.com` (200 OK)
- **Mejoras Clave Integradas:**
  1. **Rotación 3D Desactivada por Defecto:** El globo permanece fijo para inspección minuciosa sin mareo visual, permitiendo activación manual con el botón de rotación cuando el usuario lo desee.
  2. **Marcador 3D "Mi Ubicación":** Icono luminoso con pulso radar en el globo 3D usando geolocalización nativa del navegador (`navigator.geolocation`).
  3. **Exportación de Datos CSV:** Descarga directa de series temporales desde el panel de detective para análisis externo.
  4. **Deep-linking & Enlace Compartible:** Copia de URL con parámetros de dataset, coordenadas y año para compartir hallazgos específicos.
  5. **Resolución de Bloqueo DuckDB:** Control de concurrencia atómica con `Interlocked.Exchange` para configuración segura de directorios temporales en .NET 10.
