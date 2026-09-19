# ☁️ Despliegue en la Nube: Vercel (Frontend) y Render (Backend)

Volver al [[00-Map-Of-Content]] | Ver contenedores en [[08-Contenedores-Docker]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🌐 URLs Oficiales de Producción (Verificadas)

| Componente | Plataforma Cloud | URL Pública Oficial | Estado |
| :--- | :--- | :--- | :---: |
| **Frontend Web 3D** | **Vercel Edge** | [https://nasa-earth-trend-detective.vercel.app/](https://nasa-earth-trend-detective.vercel.app/) | ✅ 200 OK |
| **Backend REST API** | **Render Web Service** | [https://nasa-trend-detective-api.onrender.com](https://nasa-trend-detective-api.onrender.com) | ✅ 200 OK |
| **Health Check** | **Render Cloud** | [https://nasa-trend-detective-api.onrender.com/health](https://nasa-trend-detective-api.onrender.com/health) | ✅ 200 OK (Healthy) |

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

## 🚀 5. Flujo de Despliegue Continuo (CI/CD) y Previsualizaciones

| Entorno | Rama de Origen | Tipo de Despliegue en Vercel | Propósito y Acceso |
| :--- | :--- | :--- | :--- |
| **Producción Oficial** | `production` | 🔵 **`Production` (Current)** | [nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app/) |
| **Staging (QA)** | `qa` | 🟡 **`Preview`** | Pruebas de estrés y previsualización del equipo |
| **Desarrollo Activo** | `development` | 🟡 **`Preview`** | Previsualización de Pull Requests y nuevas funciones |

### 🔍 Cómo acceder a la previsualización en Vercel:
1. Ingresa a tu panel en [Vercel Dashboard](https://vercel.com).
2. Entra al proyecto `nasa-earth-trend-detective` y haz clic en la pestaña **Deployments**.
3. Verás la lista de despliegues identificados con su respectiva etiqueta de rama (`production`, `qa` o `development`).
4. Al hacer clic en cualquiera de ellos, pulsa el botón **Visit** en la esquina superior derecha para probar esa rama en vivo.
