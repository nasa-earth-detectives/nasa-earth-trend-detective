# 🐳 Contenedores Docker y Orquestación Local

Volver al [[00-Map-Of-Content]] | Arquitectura: [[01-Arquitectura-Monorrepo]]

---

## 🚀 Opciones de Ejecución para el Equipo

Para garantizar que los 5 integrantes del equipo (July, Reving, Johan, Diego y Brayan) puedan trabajar sin fricción en cualquier sistema operativo, existen **dos alternativas oficiales**:

### Opción A: Modo Contenedores (Docker Compose)
Ideal para entornos staging, CI/CD y despliegue unificado.

```bash
docker compose up --build
```

- **Frontend (Web):** [http://localhost:3000](http://localhost:3000)
- **Backend (API):** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

Para detener los contenedores:
```bash
docker compose down
```

---

### Opción B: Modo Nativo Zero-WSL (Desarrollo Local Directo)
Recomendado si estás en Windows y presentas incidencias con el daemon de WSL 2 o prefieres velocidad nativa con hot-reloading instantáneo.

Requiere tener instalado **.NET 10 SDK** y **Node.js 22+**:

```bash
# Iniciar Backend y Frontend en paralelo con un solo comando:
npm run dev:local
```

O en terminales independientes:
```bash
# Terminal 1: Backend .NET 10
npm run dev:backend

# Terminal 2: Frontend React 19
npm run dev:frontend
```

---

## 🏗️ Servicios Contenedorizados

1. **`api` (`backend/Dockerfile`):**
   - Multi-stage build compilado con SDK oficial de .NET 10 (`mcr.microsoft.com/dotnet/sdk:10.0`).
   - Runtime ultra-liviano Alpine Linux (`aspnet:10.0-alpine`).
   - Usuario sin privilegios (`app`) para aislamiento y seguridad.
   - Healthcheck integrado en `/health`.
   - Persistencia de DuckDB mediante volumen `nasa_data`.

2. **`web` (`frontend/Dockerfile`):**
   - Contexto en la raíz del monorrepo para resolver paquetes compartidos (`packages/shared`).
   - Build de producción con Vite y React 19.
   - Servidor Nginx Alpine con reverse proxy a la API y compresión gzip.

---

## 🔧 Solución de Problemas con WSL 2 en Windows

Si al ejecutar Docker Desktop aparece el error:
> `Error response from daemon: Docker Desktop is unable to start`

Se debe a que Windows 11 requiere inicializar el subsistema y descargar una distribución Linux. Para solucionarlo:

1. Abrir **PowerShell como Administrador**.
2. Ejecutar:
   ```powershell
   wsl --install -d Ubuntu
   ```
3. Reiniciar la computadora si Windows lo solicita.
4. Abrir Docker Desktop y verificar que el ícono esté en verde.
