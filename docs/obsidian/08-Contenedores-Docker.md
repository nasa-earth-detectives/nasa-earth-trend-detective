# 🐳 Contenedores Docker y Orquestación Local

Volver al [[00-Map-Of-Content]] | Arquitectura: [[01-Arquitectura-Monorrepo]]

---

## 🚀 Inicio en 1 Comando para los 5 Integrantes

Para evitar problemas de versiones de SDK o dependencias entre los sistemas operativos de los miembros del equipo (Windows, macOS o Linux), todo el stack se ejecuta de forma reproducible con **Docker Compose**.

### 🛠️ Comandos Principales

#### Levantar todo el monorrepo (Backend + Frontend):
```bash
docker compose up --build
```

- **Frontend (Web):** Disponible en [http://localhost:3000](http://localhost:3000)
- **Backend (API):** Disponible en [http://localhost:5000](http://localhost:5000)
- **Documentación Swagger:** [http://localhost:5000/swagger](http://localhost:5000/swagger)

#### Detener los contenedores:
```bash
docker compose down
```

---

## 🏗️ Servicios Contenedorizados

1. **`api` (`apps/api/Dockerfile`):**
   - Multi-stage build compilado con SDK de .NET 10.
   - Runtime ultra-liviano basado en Alpine Linux (`aspnet:10.0-alpine`).
   - Usuario sin privilegios (`app`) para máxima seguridad perimetral.
   - Persistencia de la base DuckDB mediante volumen local `nasa_data`.

2. **`web` (`apps/web/Dockerfile`):**
   - Multi-stage build compilando el bundle de React 19 con Vite.
   - Servidor web Nginx Alpine de alto rendimiento con compresión gzip y headers de seguridad HTTP.
   - Reverse Proxy integrado que reenvía peticiones `/api/*` al contenedor backend.
