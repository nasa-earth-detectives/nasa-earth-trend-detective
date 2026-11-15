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
* **Estado:** `desarrollando` 🟡 (Cierre Neiva: Domingo 15 de noviembre de 2026, antes de 11:59 p. m.)
* **Prioridad:** Urgent (1) 🔴
* **Asignado:** Brayan Stid Cortés Lombana (`240210240` — Frontend Lead, UI/UX, Documentación y Pitch)
* **Horas Estimadas:** 8h

### Subtareas Vinculadas a S4-T5:
| Código | Subtarea | ID ClickUp | URL ClickUp | Asignado | Estado | Prioridad | Entregables Clave |
| :--- | :--- | :---: | :--- | :--- | :---: | :---: | :--- |
| **S4-T5.1** | Actualizar textos oficiales en inglés, bio de equipo (6 integrantes) y Google Doc maestro | `86e3ban2u` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2u) | Brayan | `desarrollando` 🟡 | Normal (3) | Dossier EN [[35-NASA-Space-Apps-Official-Submission-En]], UI 100 % en inglés (PR #75) y sincronización final con Google Doc maestro. |
| **S4-T5.2** | Diseñar presentación de máximo 7 diapositivas en inglés (Opción A) y validar enlace público | `86e3ban2w` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2w) | Brayan | `to do` ⚪ | Normal (3) | Opción A oficial: 7 láminas en inglés (portada incluida) probadas en ventana incógnito. |
| **S4-T5.3** | Completar campos en portal Space Apps, declaración IA y confirmar Submit for Judging | `86e3ban2y` | [Ver en ClickUp](https://app.clickup.com/t/86e3ban2y) | Brayan | `to do` ⚪ | Urgente (1) | Verificación de despliegues Vercel + Render y envío final antes de las 11:59 p. m. |

*(Nota de historial en ClickUp: existe además la tarea completada `[S4-T5]` **`86e3jbbtx`** `Complete` 🟢 — "Puliendo el proyecto con nuevas ideas: Corrientes Oceanicas (Gods Eye View) y Capas Vivas 3D", mantenida intacta en la lista).*

---

## 📊 Estado Actualizado y Delegación del Sprint 4 (Auditoría Sincronizada 2026-11-14)

| Código | Tarea Principal | Responsable | ID ClickUp | Estado Actual | Especificación y Verificación Real en Repositorio |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **[S4-T1]** | Pruebas de integración de API, Swagger completo | Daniela Ramos (July) | [`86e3ban1p`](https://app.clickup.com/t/86e3ban1p) | `complete` 🟢 | Subtareas `86e3ban1r`, `86e3ban1u`, `86e3ban1v` completadas (`Done` en GitHub #58). |
| **[S4-T2]** | Integración de datos reales abiertos (NASA GISTEMP, POWER, GIBS, GSFC GRACE, IMERG) y seeders offline | Fabriany Medina | [`86e3ban1w`](https://app.clickup.com/t/86e3ban1w) | `complete` 🟢 | Subtareas `86e3ban1y`, `86e3ban1z`, `86e3ban20` completadas (`Done` en GitHub #59): **9/9** datasets reales en `backend/seed/*.parquet` (~34.7 MB) operando 100 % offline + tests `2000–2025` (PR #77). Hydrology Data Rods fue descontinuado oficialmente. |
| **[S4-T3]** | Validación estadística cruzada de resultados de tendencias contra informes NASA | Johan Olaya | [`86e3ban21`](https://app.clickup.com/t/86e3ban21) | `complete` 🟢 | Subtareas `86e3ban2b`, `86e3ban2c`, `86e3ban2f` completadas (`Done` en GitHub #60). |
| **[S4-T4]** | Ajustes UI Frontend para nuevas fuentes NASA/CSA, rendimiento WebGL 60 FPS y capturas demo | Diego Arias | [`86e3ban2g`](https://app.clickup.com/t/86e3ban2g) | `desarrollando` 🟡 | Subtarea [`86e3ban2j`](https://app.clickup.com/t/86e3ban2j) (`S4-T4.1`) **`complete` 🟢** tras PR #75 (UI 100 % inglés, `REAL NASA DATA 9`, QA `1440px`/`390px` limpio). Restan `S4-T4.2` (WebGL 60 FPS) y `S4-T4.3` (capturas 1080p). GitHub #61 `In Progress`. |
| **[S4-T5]** | Guion, presentación oficial (máx. 7 diapositivas en inglés) y envío definitivo Space Apps | Brayan Stid Cortés | [`86e3ban2t`](https://app.clickup.com/t/86e3ban2t) | `desarrollando` 🟡 | `S4-T5.1` (`86e3ban2u`) `desarrollando` con dossier [[35-NASA-Space-Apps-Official-Submission-En]] y UI EN en `development`. Restan `S4-T5.2` (7 slides EN) y `S4-T5.3` (`Submit for Judging`). GitHub #62 `In Progress`. |
| **[S4-T6]** | Validación estadística cruzada contra KNMI Climate Explorer y metodología SeaWiFS (NTRS) | Johan Olaya | [`1dfmnrzd7wh`](https://app.clickup.com/t/1dfmnrzd7wh) | `en pruebas` 🟣 | Motor validado contra SciPy 1.18.1, simulación AR(1) 2,000 series y suite real/NASA viva `2000–2025` en PR #77 (`209/209` + `3/3`). Subtarea [`1dfmnrzd7wm`](https://app.clickup.com/t/1dfmnrzd7wm) `en pruebas`; restan tabla manual KNMI (`S4-T6.1`), ficha SeaWiFS (`S4-T6.2`) y aval conjunto. GitHub #64 `Review`. |
| **[S4-T7]** | Exposición de metadatos de procedencia NASA/CSA/KNMI y ajuste de catálogo en API .NET 10 | Daniela Ramos (July) | [`1dfmnrzd7wn`](https://app.clickup.com/t/1dfmnrzd7wn) | `en pruebas` 🟣 | Subtareas `1dfmnrzd7wp` (`S4-T7.1`) y `1dfmnrzd7wq` (`S4-T7.2`) **`complete` 🟢** tras PR #75 + PR #77 (ventana `2000–2025` unificada, 9/9 procedencia). Resta `1dfmnrzd7wr` (`S4-T7.3`, smoke tests en Render). GitHub #65 `Review`. |
| **[PHYS-T1..T5]** | Validación física, teleconexiones, EWH, radiación CO₂ y consistencia termodinámica | Emilse Cabrera | [`1dfmnrzd7ug`](https://app.clickup.com/t/1dfmnrzd7ug) .. [`1dfmnrzd7v0`](https://app.clickup.com/t/1dfmnrzd7v0) | `ClickUp: to do ⚪` / `GitHub: Review` | Código base completo y cubierto por preblanqueo iterativo, BH FDR, GRACE/OCO-2 reales y suite `2000–2025` (PR #77). Tarjetas actualizadas en espera del aval físico final de Emilse (`GitHub #66–#69 Review`, `#70 In Progress`). Ver [[34-Trazabilidad-ClickUp-Fisica-y-Dinamica-Climatica]] y [[40-GRACE-OCO2-Reales-y-Correcciones-de-Significancia]]. |
