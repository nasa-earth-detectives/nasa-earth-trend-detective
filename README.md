# 🌍 NASA Earth System Trend Detective
> **NASA International Space Apps Challenge 2026**  
> **Categoría:** Ciencias de la Tierra (*Earth Science*) | **Dificultad:** Avanzada  
> **Plataforma:** Motor Analítico de Series Temporales y Visualizador Geoespacial 3D  
> **Monorrepo:** Backend .NET 10 (Clean Architecture & DuckDB) + Frontend React 19 + Three.js + Docker

---

## 👥 Equipo de Desarrollo (5 Integrantes)

| Integrante | Rol Oficial | Especialidad Técnica |
| :--- | :--- | :--- |
| **July** | **Lead Backend & Arquitectura** | C# .NET 10, Clean Architecture, APIs REST, Middlewares |
| **Fabriany Medina (Reving)** | **Data & ETL Engineer** | Extracción Satelital NASA, Normalización Espacial, DuckDB OLAP |
| **Johan Sebastian Olaya Reyes** | **Data Scientist & Matemáticas** | Test de Mann-Kendall, Estimador de Sen, Opposing Trends Engine |
| **Diego Arias** | **3D WebGL Specialist** | Three.js, Globe.gl, Capas de Hexágonos 3D, Shaders 60 FPS |
| **Brayan Stid Cortés Lombana (bscl)** | **Frontend Lead, UI/UX & Pitch** | React 19, Tailwind CSS, Glassmorphism, Time-Slider, Pitch NASA |

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

## 🌿 4. Protocolo de Ramas en Git (3 Ramas Estrictas)

El repositorio sigue un protocolo estricto de 3 ramas para garantizar estabilidad:

1. `development`: Rama de desarrollo activo donde se integran las tareas y componentes de los 5 participantes.
2. `qa`: Rama de aseguramiento de calidad (Staging), donde el pipeline de CI/CD despliega automáticamente para pruebas de estrés.
3. `production` (o `main`): Rama de entrega oficial para el jurado de la NASA. **Bloqueada contra commits directos; requiere pruebas previas en QA y orden explícita del equipo.**

---

## 📖 5. Documentación en Obsidian

Toda la base de conocimiento está estructurada en Markdown interconectado para **Obsidian**:
- Abre la carpeta `docs/obsidian/` en tu aplicación de **Obsidian**.
- Navega desde el Map of Content: `00-Map-Of-Content.md`.
- Explora el lienzo visual interactivo: `Canvas/NASA-Detective.canvas`.
