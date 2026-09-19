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
- **En Vivo:** Cada Pull Request o actualización genera un entorno de previsualización dinámico (*Preview Deployment*) en Vercel para pruebas en navegador antes del merge.

### 2. `qa` (Aseguramiento de Calidad y Staging)
- Rama donde se validan las pruebas de integración, latencia de DuckDB (<50ms) y fluidez WebGL a 60 FPS.
- El pipeline de [[06-Pipeline-CI-CD]] ejecuta el job `deploy-qa` automáticamente al recibir cambios.
- **En Vivo:** Cuenta con su propio despliegue de staging en Vercel (disponible en la pestaña *Deployments*).

### 3. `production` (Producción Oficial)
- Rama protegida y predeterminada del repositorio, reservada exclusivamente para la entrega oficial ante el jurado de la NASA.
- ⚠️ **Regla Inquebrantable:** Prohibido hacer commits directos a `production`. Solo se promociona tras validación exhaustiva en `qa` y orden explícita del equipo.
- **En Vivo:** 
  - **Frontend:** [https://nasa-earth-trend-detective.vercel.app/](https://nasa-earth-trend-detective.vercel.app/)
  - **Backend API:** [https://nasa-trend-detective-api.onrender.com/health](https://nasa-trend-detective-api.onrender.com/health)
  - Ver guía detallada en [[10-Despliegue-Cloud-Vercel-Render]].

---

## 🛡️ Blindaje Técnico: Prohibición de Force Push (`git push --force`)
1. **Inmutabilidad del Historial:** Las 3 ramas tienen activo el GitHub Ruleset `Strict Shield` (`non_fast_forward`). Ningún miembro del equipo puede reescribir la historia ni sobrescribir commits ya publicados.
2. **Actualizaciones Limpias:** Para actualizar ramas locales de trabajo sin generar conflictos destructivos, se utiliza `git fetch origin` seguido de `git merge origin/development` o `git stash` si existen cambios sin guardar.
3. **Gestión de PRs:** Toda integración a `development` requiere revisión de pares (`CODEOWNERS`) y superación de la suite de pruebas automatizadas.

---

## 🔗 Enlaces Relacionados
- [[06-Pipeline-CI-CD]]
- [[07-Estandares-Ingenieria]]
- [[09-Gobernanza-GitHub-Org-y-Projects]]
- [[10-Despliegue-Cloud-Vercel-Render]]
