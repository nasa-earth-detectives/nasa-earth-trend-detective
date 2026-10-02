# GitHub Copilot Instructions — NASA Earth System Trend Detective

Estas instrucciones son el estándar obligatorio que GitHub Copilot debe seguir al analizar código, sugerir cambios, responder consultas y **revisar Pull Requests (PRs)** en este repositorio.

---

## 🛡️ 1. Estándares de Arquitectura y Reglas Innegociables

### A. Modularidad Estricta y Anti God-Class (Regla SRP)
* **Límite de líneas:** Ningún archivo debe exceder las **150-200 líneas de código**.
* **Separación de responsabilidades:**
  - **Backend (.NET 10):** Controladores delgados (*Skinny Controllers*), lógica en clases de servicio y calculadores aislados (`Statistics/`), entidades de dominio puras y repositorios desacoplados con interfaces.
  - **Frontend (React 19 / TypeScript):** Componentes pequeños y reutilizables, lógica desacoplada en custom hooks o archivos utilitarios puros.
* **Acción en revisión:** Si un archivo nuevo o modificado sobrepasa las 200 líneas o asume múltiples responsabilidades, **solicitar refactorización y división inmediata**.

### B. Cero Código Quemado (No Hardcoding) y Dinamismo Absoluto
* **PROHIBIDO:**
  - Hardcodear IDs numéricos de registros (ej. `id == 1` o `Find(5)`).
  - URLs absolutas o rutas de entorno quemadas en el código fuente.
  - Strings mágicos sueltos para estados, roles o categorías.
  - Tasas, coeficientes o umbrales fijos sin constantes nombradas o configuración.
* **OBLIGATORIO:**
  - Utilizar variables de entorno (`.env`, `IConfiguration` en backend, `import.meta.env` en frontend).
  - Usar **Enums Tipados** (ej. `TrendDirection`, `TrendSignificance`, `ObservationMode`).
  - Lógica configurable y parametrizable desde base de datos o inyección de dependencias.

### C. Estrategia de Ramas en Git (3 Ramas Estrictas)
* El flujo de trabajo del repositorio opera exclusivamente sobre tres ramas base:
  1. `development`: Rama de desarrollo activo donde se fusionan los feature branches por sprint.
  2. `qa`: Rama de aseguramiento de calidad y pruebas (Staging).
  3. `production`: Rama oficial y estable para entregas finales al jurado.
* **Regla estricta:** **PROHIBIDO** aprobar o permitir Pull Requests dirigidos directamente a `production` que no provengan de `qa` debidamente validado.

### D. Blindaje Integral Anti-Bots y Seguridad perimetral
* Todo endpoint de mutación (`POST`, `PUT`, `PATCH`, `DELETE`) y formulario de usuario debe contar con:
  1. **Campo Honeypot invisible:** Si el campo recibe cualquier valor, abortar inmediatamente con `400 Bad Request` antes de procesar transacciones.
  2. **Rate Limiting:** Control de frecuencia por IP específico según el contexto (estricto en mutaciones y auth, moderado en lecturas).
  3. **Validación de User-Agent:** Rechazar firmas de escáneres automáticos maliciosos (`sqlmap`, `nikto`, `masscan`, etc.) con `403 Forbidden`.

### E. Rigor Científico y Datos Climáticos NASA
* **Algoritmos Estadísticos:**
  - Toda tendencia climática debe calcularse con **estadística no paramétrica**: Test de Mann-Kendall con corrección por empates (*tie correction*) y Estimador de Pendiente de Sen (*Sen's Slope* con intervalo de confianza al 95%).
  - Prohibido asumir distribuciones gaussianas en datos de precipitación o anomalías térmicas extremas sin la prueba no paramétrica correspondiente.

### F. Documentación Viva en `docs/obsidian/`
* Toda nueva funcionalidad, endpoint, entidad de dominio o cambio arquitectónico debe acompañarse de su correspondiente actualización en las notas de `docs/obsidian/` en el mismo PR.

---

## 🎯 2. Formato de Veredicto en Revisiones de PR

Cuando GitHub Copilot emita una revisión o evaluación de un Pull Request, debe estructurar su comentario con las siguientes secciones:

```markdown
### 🤖 GitHub Copilot PR Review Assessment

#### 1. Verificación de Cumplimiento de Reglas
- [ ] **Modularidad (<200 líneas):** [PASA / REQUIERE CAMBIO]
- [ ] **Cero Hardcoding (Enums/Env):** [PASA / REQUIERE CAMBIO]
- [ ] **Estrategia de Ramas:** [PASA / REQUIERE CAMBIO]
- [ ] **Seguridad / Anti-Bots:** [PASA / NO APLICA / REQUIERE CAMBIO]
- [ ] **Rigor Científico (Mann-Kendall/Sen):** [PASA / NO APLICA / REQUIERE CAMBIO]
- [ ] **Documentación en docs/obsidian/:** [PASA / REQUIERE CAMBIO]

#### 2. Hallazgos y Sugerencias de Código
[Detalle de mejoras de rendimiento, tipado estricto o modularidad]

#### 3. Veredicto Final
**[APROBADO ✅ / CAMBIOS SOLICITADOS ⚠️]**
```

---

## ⚡ 3. Optimización de Tokens y Cuota Mensual
* Concéntrate exclusivamente en el diff de archivos de código fuente (`.cs`, `.ts`, `.tsx`, `.sql`, `.json`, `.yml`).
* No evalúes archivos binarios, texturas 3D (`.webp`, `.png`, `.jpg`), modelos (`.glb`), lockfiles (`package-lock.json`) ni reportes generados automáticamente (`dist/`, `bin/`, `obj/`).
* Proporciona respuestas concisas, de alto valor técnico y accionables.
