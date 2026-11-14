# 📋 Trazabilidad en ClickUp — Sprint 4: Ajustes Hackathon Neiva, Rigor Científico y Entrega NASA

- **Espacio en ClickUp:** `NASA Space Apps 2026` (ID: `90177646254`)
- **Carpeta:** `NASA Earth System Trend Detective` (ID: `901711444394`)
- **Lista:** `Sprint 4: Rigor Científico, Pruebas de Integración y Presentación Final` (ID: `901717181780`)
- **Módulo Paralelo Física:** `Física Climática, Dinámica Atmosférica y Teleconexiones` (ID: `1600500000000664`) → [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]]
- **Automatizador:** `clickup-task-automator` (`npm run sync:hackathon`, actualización no destructiva vía ClickUp API v2)
- **Relacionado:** [[00-Map-Of-Content]], [[03-Roles-y-Equipo]], [[04-Sprints-y-Roadmap]], [[05-Rigor-Cientifico-MannKendall]], [[10-Despliegue-Cloud-Vercel-Render]], [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]]

---

## 🎯 Tarea Principal de Cierre: Presentación Oficial (7 Diapositivas) y Envío Space Apps

* **Código:** `[S4-T5]`
* **ID ClickUp:** `86e3ban2t`
* **Nombre:** **[S4-T5] Guion, presentación oficial (máx. 7 diapositivas en inglés) y envío definitivo Space Apps**
* **URL:** [https://app.clickup.com/t/86e3ban2t](https://app.clickup.com/t/86e3ban2t)
* **Estado:** `to do` ⚪ (Cierre Neiva: Domingo 15 de noviembre de 2026, antes de 11:59 p. m.)
* **Prioridad:** Urgent (1) 🔴
* **Asignado:** Brayan Stid Cortés Lombana (`240210240` — Frontend Lead, UI/UX, Documentación y Pitch)
* **Horas Estimadas:** 8h

### Subtareas Vinculadas a S4-T5:
| Código | Subtarea | ID ClickUp | URL ClickUp | Asignado | Estado | Prioridad | Entregables Clave |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **S4-T5.1** | Actualizar textos oficiales en inglés, bio de equipo (6 integrantes) y Google Doc maestro | `86e3ban2u` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2u) | Brayan | `to do` ⚪ | Normal (3) | Dossier EN/ES, declaración de IA, fuentes NASA/CSA/KNMI y equipo de 6 en plataforma. |
| **S4-T5.2** | Diseñar presentación de máximo 7 diapositivas en inglés (Opción A) y validar enlace público | `86e3ban2w` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2w) | Brayan | `to do` ⚪ | Normal (3) | Opción A oficial: 7 láminas en inglés (portada incluida) probadas en ventana incógnito. |
| **S4-T5.3** | Completar campos en portal Space Apps, declaración IA y confirmar Submit for Judging | `86e3ban2y` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2y) | Brayan | `to do` ⚪ | Urgente (1) | Verificación de despliegues Vercel + Render y envío final antes de las 11:59 p. m. |

*(Nota de historial en ClickUp: existe además la tarea completada `[S4-T5]` **`86e3jbbtx`** `Complete` 🟢 — "Puliendo el proyecto con nuevas ideas: Corrientes Oceanicas (Gods Eye View) y Capas Vivas 3D", mantenida intacta en la lista).*

---

## 📊 Estado Actualizado y Delegación del Sprint 4 (Hackathon Neiva 14–15 Nov)

| Código | Tarea Principal | Responsable | ID ClickUp | Estado Actual | Especificación y Ajustes Hackathon |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **[S4-T1]** | Pruebas de integración de API, Swagger completo | Daniela Ramos (July) | [`86e3ban1p`](https://app.clickup.com/t/86e3ban1p) | `complete` 🟢 | Subtareas `86e3ban1r`, `86e3ban1u`, `86e3ban1v` completadas (WebApplicationFactory, Swagger, códigos HTTP). |
| **[S4-T2]** | Integración de datos reales abiertos (NASA AppEEARS, Giovanni, Hydrology, NOAA CDO, CSA SWOT) y seeders offline | Fabriany Medina | [`86e3ban1w`](https://app.clickup.com/t/86e3ban1w) | `to do` ⚪ | Subtareas `86e3ban1y` (T2.1), `86e3ban1z` (T2.2), `86e3ban20` (T2.3). Cargar series reales sin token en vivo y empaquetar DuckDB (< 50 MB). |
| **[S4-T3]** | Validación estadística cruzada de resultados de tendencias contra informes NASA | Johan Olaya | [`86e3ban21`](https://app.clickup.com/t/86e3ban21) | `complete` 🟢 | Subtareas `86e3ban2b`, `86e3ban2c`, `86e3ban2f` completadas (Ártico +0.70°C/década GISTEMP y Groenlandia GRACE-FO). |
| **[S4-T4]** | Ajustes UI Frontend para nuevas fuentes NASA/CSA, rendimiento WebGL 60 FPS y capturas demo | Diego Arias | [`86e3ban2g`](https://app.clickup.com/t/86e3ban2g) | `desarrollando` 🟡 | **En curso por Diego.** Subtareas [`86e3ban2j`](https://app.clickup.com/t/86e3ban2j) (`desarrollando`), `86e3ban2p` (T4.2), `86e3ban2q` (T4.3). Ajustes UI/responsivo y créditos NASA/CSA. |
| **[S4-T5]** | Guion, presentación oficial (máx. 7 diapositivas en inglés) y envío definitivo Space Apps | Brayan Stid Cortés | [`86e3ban2t`](https://app.clickup.com/t/86e3ban2t) | `to do` ⚪ | Subtareas `86e3ban2u`, `86e3ban2w`, `86e3ban2y`. Presentación Opción A (máx. 7 diapositivas EN) y cierre oficial en portal NASA. |
| **[S4-T6]** | Validación estadística cruzada contra KNMI Climate Explorer y metodología SeaWiFS (NTRS) | Johan Olaya | [`1dfmnrzd7wh`](https://app.clickup.com/t/1dfmnrzd7wh) | `to do` ⚪ | **Nueva.** Subtareas [`1dfmnrzd7wj`](https://app.clickup.com/t/1dfmnrzd7wj) (T6.1 KNMI), [`1dfmnrzd7wk`](https://app.clickup.com/t/1dfmnrzd7wk) (T6.2 SeaWiFS NTRS 20090042747), [`1dfmnrzd7wm`](https://app.clickup.com/t/1dfmnrzd7wm) (T6.3 lag-1 con Emilse). |
| **[S4-T7]** | Exposición de metadatos de procedencia NASA/CSA/KNMI y ajuste de catálogo en API .NET 10 | Daniela Ramos (July) | [`1dfmnrzd7wn`](https://app.clickup.com/t/1dfmnrzd7wn) | `to do` ⚪ | **Nueva.** Subtareas [`1dfmnrzd7wp`](https://app.clickup.com/t/1dfmnrzd7wp) (T7.1 NasaDatasetCatalog), [`1dfmnrzd7wq`](https://app.clickup.com/t/1dfmnrzd7wq) (T7.2 DuckDB/Render 256MB), [`1dfmnrzd7wr`](https://app.clickup.com/t/1dfmnrzd7wr) (T7.3 smoke tests Swagger/Render). |
| **[PHYS-T1..T5]** | Validación física, teleconexiones, EWH y revisión activa de fuentes de datos a consultar | Emilse Cabrera | [`1dfmnrzd7ug`](https://app.clickup.com/t/1dfmnrzd7ug) .. [`1dfmnrzd7v0`](https://app.clickup.com/t/1dfmnrzd7v0) | `to do` ⚪ | Revisión activa de fuentes (AppEEARS, Hydrology Time Series, NOAA CDO, CSA SWOT/RCM, KNMI) + ventana principal de QA físico domingo 11:00–12:00 m. |
