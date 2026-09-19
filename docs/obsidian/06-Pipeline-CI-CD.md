# 🚀 Pipeline de Integración y Entrega Continua (CI/CD)

Volver al [[00-Map-Of-Content]] | Ver ramas en [[02-Estrategia-Git-3-Ramas]]

---

## 🛡️ Flujo Automatizado con Freno Estricto en QA

El pipeline de GitHub Actions (`.github/workflows/ci-qa.yml`) asegura que cada contribución al monorrepo sea analizada y probada rigurosamente.

### 🔄 Fases del Pipeline:

1. **Quality & Linting Gate:**
   - Análisis estático de código en TypeScript y C#.
   - Verificación de tipos estricta (`tsc --noEmit`).
   - Auditoría de reglas de arquitectura (<150 líneas por archivo).

2. **Backend Build & Testing (.NET 10):**
   - Compilación con SDK 10.0 en modo Release.
   - Ejecución de pruebas unitarias xUnit (incluyendo Mann-Kendall con series de control sintéticas).

3. **Frontend Build & Testing (React 19):**
   - Compilación del bundle con Vite y verificación de librerías WebGL.

4. **Docker Validation:**
   - Construcción de imágenes Docker multi-stage para backend y frontend.
   - Ver detalles en [[08-Contenedores-Docker]].

5. **Despliegue Automático a QA (Staging):**
   - El código integrado en la rama `development` y `qa` se despliega automáticamente en el entorno de pruebas Staging.

6. **🛑 Bloqueo Estricto de Producción:**
   - **PROHIBIDO el pase automático a producción.**
   - La promoción hacia la rama `production` requiere la aprobación manual del equipo y la realización de pruebas de estrés finales antes de la entrega al jurado de la NASA.
