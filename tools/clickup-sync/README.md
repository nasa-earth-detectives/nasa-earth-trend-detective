# 🛰️ NASA Earth System Trend Detective - ClickUp Connector

Herramienta de automatización y sincronización para conectar el proyecto **NASA Earth System Trend Detective** (NASA Space Apps Challenge 2026) con la plataforma **ClickUp**, asignando las 20 tareas técnicas y científicas de los 4 Sprints a un equipo balanceado de **5 participantes**.

---

## 👥 Roles y Distribución del Equipo (5 Participantes)

| Participante | Especialidad | Stack Principal | Tareas Asignadas | Horas Totales |
| :--- | :--- | :--- | :---: | :---: |
| **Participante 1** | **Lead Backend & Arquitectura** | C# .NET 10, Clean Architecture, REST API, Swagger | 4 tareas (S1-T1, S2-T1, S3-T1, S4-T1) | **25h** |
| **Participante 2** | **Data & ETL Engineer** | DuckDB OLAP, Parquet, NASA Datasets | 4 tareas (S1-T2, S2-T2, S3-T2, S4-T2) | **26h** |
| **Participante 3** | **Data Scientist / Scientific Computing** | Mann-Kendall Test, Sen's Slope, Opposing Trends | 4 tareas (S1-T3, S2-T3, S3-T3, S4-T3) | **28h** |
| **Participante 4** | **Frontend & 3D WebGL Specialist** | React 19, TypeScript, Globe.gl, Three.js, Vite | 4 tareas (S1-T4, S2-T4, S3-T4, S4-T4) | **25h** |
| **Participante 5** | **UI/UX Designer, QA & Pitch Lead** | Tailwind CSS, Glassmorphism, Time-Slider, Pitch Video | 4 tareas (S1-T5, S2-T5, S3-T5, S4-T5) | **24h** |

---

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
cd "nasa proyect/clickup-sync"
npm install
```

### 2. Probar en Modo Simulación (Dry-Run)
*No requiere token de ClickUp ni realiza llamadas externas.*
```bash
npm run dry-run
```
Este comando valida la carga de las 20 tareas, el cálculo de horas y la asignación a los 5 participantes.

### 3. Configurar Credenciales de ClickUp
Copia la plantilla `.env.example` a un nuevo archivo `.env`:
```bash
cp .env.example .env
```
Edita `.env` e introduce tu Token personal de ClickUp:
```env
CLICKUP_API_TOKEN=pk_tu_token_de_clickup_aqui
CLICKUP_TEAM_ID=
CLICKUP_SPACE_NAME=NASA Space Apps 2026
CLICKUP_FOLDER_NAME=NASA Earth System Trend Detective
```

> **¿Dónde obtener el API Token de ClickUp?**  
> En tu cuenta de ClickUp: Ve a *Settings (Tu avatar abajo a la izquierda) > Apps > API Token* y haz clic en *Generate / Copy*.

### 4. Descubrir tu Workspace ID y Miembros
Una vez colocado el token en `.env`, ejecuta:
```bash
npm run teams
```
Verás la lista de Workspaces y los IDs numéricos de cada participante para asignarlos directamente en `.env`.

### 5. Sincronizar en Vivo con ClickUp
```bash
npm run sync
```
Esto creará automáticamente:
1. El Espacio: `NASA Space Apps 2026` (si no existe).
2. La Carpeta: `NASA Earth System Trend Detective`.
3. Las 4 Listas correspondientes a los Sprints:
   - `Sprint 1: Datos, ETL y Arquitectura Base`
   - `Sprint 2: Motor Científico y Pipeline Analítico`
   - `Sprint 3: Experiencia 3D, Tendencias Opuestas e Integración`
   - `Sprint 4: Pulido, Rigor Científico, QA y Pitch NASA`
4. Las 20 tareas con prioridades, horas estimadas, criterios de aceptación, DoD y asignados.

---

## 🛠️ Comandos Disponibles

- `npm run dry-run`: Simula la asignación y estructura sin tocar ClickUp.
- `npm run teams`: Lista los Workspaces y miembros de tu cuenta ClickUp.
- `npm run sync`: Crea y asigna la estructura completa en ClickUp.
- `npm run type-check`: Valida el tipado estricto de TypeScript.
