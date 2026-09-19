# 🌿 Estrategia de Ramas en Git (3 Ramas Estrictas)

Volver al [[00-Map-Of-Content]]

---

## 🛡️ Protocolo de Control de Versiones

Para asegurar máxima estabilidad y rigor profesional en el repositorio, el proyecto sigue una estrategia estricta de **3 ramas**:

```
[production]   ─────────────────────────────────────────────● (Entrega Final Jurado NASA)
                     ▲
                     │ Pull Request validado + Aprobación manual
[qa]           ──────┴──────────────────────●─────────────── (Staging / Pruebas de Estrés)
                            ▲
                            │ Integración Continua Automática
[development]  ────●───────┴──────●───────────────────────── (Desarrollo Activo del Equipo)
```

### 1. `development` (Desarrollo Activo)
- Rama donde los 5 integrantes integran sus funcionalidades, endpoints, shaders y componentes.
- Todos los commits atómicos y Pull Requests de tareas se abren contra esta rama.

### 2. `qa` (Aseguramiento de Calidad y Staging)
- Rama donde se validan las pruebas de integración, latencia de DuckDB (<50ms) y fluidez WebGL a 60 FPS.
- El pipeline de [[06-Pipeline-CI-CD]] despliega automáticamente hasta este entorno.

### 3. `production` (Producción Estable)
- Rama protegida y reservada exclusivamente para el despliegue de entrega oficial ante el jurado de la NASA.
- ⚠️ **Regla Inquebrantable:** Prohibido hacer commits directos a `production`. Solo se promociona tras validación exhaustiva en `qa` y orden explícita del equipo.

---

## 🔗 Enlaces Relacionados
- [[06-Pipeline-CI-CD]]
- [[07-Estandares-Ingenieria]]
