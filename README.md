# 🌍 NASA Earth System Trend Detective
> **NASA International Space Apps Challenge 2026**  
> **Categoría:** Ciencias de la Tierra (*Earth Science*) | **Dificultad:** Avanzada  
> **Plataforma:** Motor Analítico de Series Temporales y Visualizador Geoespacial 3D  
> **Monorrepo:** Backend .NET 10 (Clean Architecture & DuckDB) + Frontend React 19 + Three.js + Docker
---

## 🚀 Panel de Acceso Rápido para Desarrolladores

| Entorno / Recurso | Rama / Origen | Enlace de Acceso Directo | Estado / Propósito |
| :--- | :--- | :--- | :---: |
| 🌐 **Frontend Producción** | `production` | [nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app/) | 🟢 **200 OK (En Vivo Oficial)** |
| 🧪 **Frontend Staging (QA)** | `qa` | [nasa-earth-trend-detective-qa.vercel.app](https://nasa-earth-trend-detective-qa.vercel.app/) | 🟢 **200 OK (En Vivo Fijo)** |
| 🛠️ **Frontend Development** | `development` | [nasa-earth-trend-detective-dev.vercel.app](https://nasa-earth-trend-detective-dev.vercel.app/) | 🟢 **200 OK (En Vivo Fijo)** |
| 📡 **Backend REST API** | `production` | [nasa-trend-detective-api.onrender.com/health](https://nasa-trend-detective-api.onrender.com/health) | 🟢 **200 OK (En Vivo)** |
| 📋 **Tablero Kanban** | GitHub Projects | [NASA Trend Detective Projects #1](https://github.com/orgs/nasa-earth-detectives/projects/1) | 📌 **Gestión de Tareas** |
| 👥 **Matriz de Roles** | Monorrepo | [TEAM.md](TEAM.md) | 📄 **Responsabilidades** |
| 🤝 **Guía de Contribución** | Protocolo Git | [CONTRIBUTING.md](CONTRIBUTING.md) | 🛡️ **Flujo de Pull & PRs** |

> 💡 **Acceso en 1 Clic desde GitHub:** En la barra lateral derecha de este repositorio (sección **Environments**), haz clic en **`production`**, **`qa`** o **`development`** para ver el historial y abrir el despliegue directamente.

---

## 👥 Estructura del Equipo y Roles Oficiales
> Para conocer la matriz de responsabilidades completa y flujos de revisión, consulta [TEAM.md](TEAM.md).

### 🖥️ Subequipo Backend & Núcleo Científico ([@nasa-earth-detectives/backend-team](https://github.com/orgs/nasa-earth-detectives/teams/backend-team))
| Integrante | Rol Oficial | Especialidad Técnica | Responsabilidad Monorrepo |
| :--- | :--- | :--- | :--- |
| **July** | **Lead Backend & Arquitectura** | C# .NET 10, Clean Architecture, APIs REST, Middlewares | `backend/src/NasaTrendDetective.Api/` |
| **Fabriany Medina (Reving)** | **Data & ETL Engineer** | Extracción Satelital NASA, Normalización Espacial, DuckDB OLAP | `backend/src/NasaTrendDetective.Infrastructure/`, `data/` |
| **Johan Sebastian Olaya Reyes** | **Data Scientist & Matemáticas** | Test de Mann-Kendall, Estimador de Sen, Opposing Trends Engine | `backend/src/NasaTrendDetective.Application/` |

### 🎨 Subequipo Frontend & Visualización 3D ([@nasa-earth-detectives/frontend-team](https://github.com/orgs/nasa-earth-detectives/teams/frontend-team))
| Integrante | Rol Oficial | Especialidad Técnica | Responsabilidad Monorrepo |
| :--- | :--- | :--- | :--- |
| **Brayan Stid Cortés Lombana (bscl)** | **Frontend Lead, UI/UX & Pitch** | React 19, Tailwind CSS, Glassmorphism, Time-Slider, Pitch NASA | `frontend/`, `packages/shared/`, `docs/` |
| **Diego Arias** | **3D WebGL Specialist** | Three.js, Globe.gl, Capas de Hexágonos 3D, Shaders 60 FPS | `frontend/src/components/Globe/`, `public/` |

---

## 🎯 1. Visión General del Desafío

El sistema ambiental interconectado de la Tierra se encuentra en constante transformación. Nuestro objetivo es actuar como **Detectives de Tendencias del Sistema Terrestre**, resolviendo con rigurosidad matemática y visual las 4 preguntas de la NASA:

| Interrogante NASA | Respuesta de Nuestra Plataforma |
| :--- | :--- |
| **1. ¿Qué está cambiando?** | Detección multivariable: Temperatura Superficial (**GISTEMP**), Biomasa/Vegetación (**MODIS NDVI**), Anomalías de Masa de Hielo y Agua (**GRACE-FO**), Concentración de $CO_2$ (**OCO-2**) y Nivel del Mar (**Sentinel-6**). |
| **2. ¿Dónde está cambiando?** | Mapeo geoespacial global tridimensional con resolución por celdas latitud/longitud en WebGL a 60 FPS. |
| **3. ¿Cuánto está cambiando?** | Cuantificación de la tasa de cambio temporal mediante la **Pendiente de Sen (*Sen's Slope*)** por década. |
| **4. ¿Es significativo?** | Evaluación matemática no paramétrica mediante el **Test de Mann-Kendall** ($|Z| > 1.96$, $p < 0.05$). |

---

## 🚀 2. Opciones de Ejecución

### Opción A: Con Docker Compose
Levanta todo el ecosistema (Backend API + Frontend Web) en un solo comando:

```bash
docker compose up --build
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **Health Check:** [http://localhost:5000/health](http://localhost:5000/health)

Para detener los servicios:
```bash
docker compose down
```

### Opción B: Modo Nativo Zero-WSL (Desarrollo Local Directo)
Si prefieres velocidad nativa con hot-reloading instantáneo o estás configurando WSL 2 en Windows:

```bash
# Iniciar Backend (.NET 10) y Frontend (React 19) en paralelo:
npm run dev:local
```

O de forma independiente:
- **Backend:** `npm run dev:backend` (en puerto 5000)
- **Frontend:** `npm run dev:frontend` (en puerto 3000)

---

## 🏗️ 3. Estructura del Monorrepo

```
nasa-project/
├── backend/                       # Backend .NET 10 (Clean Architecture & DuckDB)
├── frontend/                      # Frontend React 19 + Three.js + Globe.gl + Tailwind
├── packages/
│   └── shared/                    # Contratos de datos biofísicos y DTOs comunes
├── docs/
│   └── obsidian/                  # Bóveda de documentación técnica y científica
├── .github/
│   └── workflows/ci-qa.yml        # Pipeline CI/CD automatizado hasta QA
└── docker-compose.yml             # Orquestación multi-contenedor local
```

---

## 🌿 4. Protocolo de Ramas en Git y Despliegues en Vivo (3 Ramas Estrictas)

El repositorio sigue un protocolo estricto de 3 ramas para garantizar estabilidad y previsualización continua:

| Rama | Entorno en Vercel | Dominio Fijo Permanente | Propósito y Estado |
| :--- | :--- | :--- | :--- |
| **`production`** ⭐ | 🔵 **`Production`** | [nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app/) | **Demo Jurado NASA:** Versión oficial y estable evaluada. |
| **`qa`** | 🟡 **`Preview (QA)`** | [nasa-earth-trend-detective-qa.vercel.app](https://nasa-earth-trend-detective-qa.vercel.app/) | **Staging / Pruebas:** Validación continua del equipo. |
| **`development`** | 🟣 **`Preview (Dev)`** | [nasa-earth-trend-detective-dev.vercel.app](https://nasa-earth-trend-detective-dev.vercel.app/) | **Desarrollo Activo:** Últimos cambios de código en tiempo real. |

> 💡 **Enlaces Fijos Permanentes:** Cada una de las 3 ramas tiene su propio dominio canónico asignado en Vercel. Nunca cambian de URL, independientemente de los commits o PRs que se generen. Cada push o merge a la rama correspondiente actualiza automáticamente su sitio en vivo.

---

## 📖 5. Documentación en Obsidian

Toda la base de conocimiento está estructurada en Markdown interconectado para **Obsidian**:
- Abre la carpeta `docs/obsidian/` en tu aplicación de **Obsidian**.
- Navega desde el Map of Content: `00-Map-Of-Content.md`.
- Explora el lienzo visual interactivo: `Canvas/NASA-Detective.canvas`.
- Revisa la guía de gobernanza y reglas de GitHub en `09-Gobernanza-GitHub-Org-y-Projects.md`.

---

## 🤝 6. Gobernanza de Equipo y Contribución

- **Organización de GitHub:** [https://github.com/nasa-earth-detectives](https://github.com/nasa-earth-detectives)
- **Tablero GitHub Projects:** [NASA Earth System Trend Detective](https://github.com/orgs/nasa-earth-detectives/projects/1)
- **Guía de Contribución:** Consulta [CONTRIBUTING.md](CONTRIBUTING.md) para conocer el protocolo de Pull Requests y commits convencionales.
- **Asignación de Revisores:** Consulta [.github/CODEOWNERS](.github/CODEOWNERS) para identificar al responsable de cada módulo técnico.
- **Gestión de Sprints:** Sincronización de tareas atómicas mediante GitHub Projects Kanban y ClickUp.
