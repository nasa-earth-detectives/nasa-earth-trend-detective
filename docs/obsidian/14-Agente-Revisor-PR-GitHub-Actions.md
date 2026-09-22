# 🤖 Agente de IA Revisor de Pull Requests (GitHub Actions)

- **Workflow:** `.github/workflows/ai-pr-reviewer.yml`
- **Script Ejecutor:** `.github/scripts/ai-pr-reviewer.mjs`
- **Motor de Reglas:** `.github/scripts/pr-audit-rules.mjs`
- **Modelo de IA:** Google Gemini (`gemini-2.5-flash`)
- **Gobernanza:** `@brayancortes22`, `@july173` (Codeowners de `/.github/`)
- **Relacionado:** [[00-Map-Of-Content]], [[02-Estrategia-Git-3-Ramas]], [[06-Pipeline-CI-CD]], [[07-Estandares-Ingenieria]], [[09-Gobernanza-GitHub-Org-y-Projects]]

---

## 🎯 Objetivo y Filosofía
El **Agente de IA Revisor de Pull Requests** es un mecanismo de defensa automatizado que audita cada PR antes de su integración en las ramas protegidas (`development`, `qa`, `production`).

Su propósito es **prevenir la entrada de regresiones arquitectónicas, incompatibilidades de librerías y violaciones de diseño** (como las incidencias detectadas en sombreadores WebGL y ciclo de vida de React 19).

```
                  ┌────────────────────────────────────────────────┐
                  │          Pull Request Abierto / Sync           │
                  └──────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                  ┌────────────────────────────────────────────────┐
                  │    GitHub Action (.github/workflows/ai-pr.yml) │
                  │  Extrae el git diff de los archivos alterados  │
                  └──────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                  ┌────────────────────────────────────────────────┐
                  │             Agente IA Revisor (Gemini)         │
                  │   Evalúa con las reglas de GEMINI.md:          │
                  │   • Incompatibilidades de Three.js / WebGL     │
                  │   • Fugas en React 19 StrictMode               │
                  │   • Archivos monolíticos (>200 líneas)         │
                  │   • Código quemado / Hardcoding                │
                  └──────────────────────┬─────────────────────────┘
                                         │
                                         ▼
                  ┌────────────────────────────────────────────────┐
                  │    Comenta automáticamente el informe en el PR │
                  │    (Aprobado o alertando sobre posibles bugs)  │
                  └────────────────────────────────────────────────┘
```

---

## 🛡️ Criterios de Evaluación Obligatorios (`GEMINI.md`)

| Criterio | Regla | Detección Automática |
| :--- | :--- | :--- |
| **Modularidad Estricta** | Archivos < 150-200 líneas (Anti God-Class) | Conteo estático de líneas en diffs y archivos modificados |
| **Anti-Hardcoding** | Cero IDs numéricos quemados (`find(123)`), URLs absolutas | Regex patterns de valores mágicos y credenciales |
| **Three.js / WebGL** | Caché dinámico de shaders y compatibilidad v0.186 | Detección de `customProgramCacheKey` estático y firmas obsoletas |
| **React 19 Ciclo de Vida** | Compatibilidad con montaje doble de `StrictMode` | Advertencia sobre destrucciones irreversibles de WebGL |
| **Blindaje y Seguridad** | Protección contra bots, honeypots y rate limiting | Revisión de formularios y endpoints de mutación |

---

## ⚙️ Configuración del Secreto en GitHub

Para habilitar el análisis de IA generativa con Gemini:
1. Ir al repositorio en GitHub: **Settings** -> **Secrets and variables** -> **Actions**.
2. Crear un nuevo secreto del repositorio:
   * **Nombre:** `GEMINI_API_KEY`
   * **Valor:** Tu API Key de Google AI Studio (Gemini API gratuita).
3. Si el secreto no está configurado, el flujo ejecuta automáticamente la **auditoría estática heurística local** sin bloquear el pipeline.

---

## 🧪 Ejecución Local y Pruebas (Dry-Run)

Los desarrolladores pueden ejecutar el revisor en sus máquinas antes de abrir un PR:

```bash
# Ejecutar auditoría estática en modo dry-run contra la rama base
node .github/scripts/ai-pr-reviewer.mjs --dry-run
```
