## 🌍 NASA Earth System Trend Detective - Pull Request

### 📌 Referencia del Issue / Tarea
Closes #<!-- Número del Issue o código ClickUp ej. [S3-T4] -->

---

### 🏷️ Tipo de Cambio
- [ ] `feat`: Nueva funcionalidad o módulo
- [ ] `fix`: Corrección de bug o anomalía de datos
- [ ] `docs`: Documentación técnica (Obsidian / README)
- [ ] `perf`: Optimización de rendimiento (WebGL 60 FPS / DuckDB < 50ms)
- [ ] `refactor`: Refactorización modular sin alterar comportamiento
- [ ] `governance`: Reglas de CI/CD, Copilot o infraestructura

---

### 🌿 Rama de Destino (Regla de 3 Ramas)
- [ ] `development` (Desarrollo activo y features de sprint)
- [ ] `qa` (Staging de calidad antes de entrega)
- [ ] `production` (⚠️ Solo admitido desde rama `qa` validada)

---

### 🎯 Descripción del Cambio
<!-- Explicación concisa del cambio y motivación técnica -->

---

### 🤖 Gobernanza y Revisión con GitHub Copilot
- [ ] **Listo para revisión final** (Si está en borrador, márcalo como Draft para no gastar cuota de Copilot).
- [ ] **Etiqueta `copilot-review` añadida** (o invoca `/copilot-review` en comentarios si requieres nueva evaluación).
- [ ] **Archivos de código verificados** (Archivos puramente estáticos o docs no consumen cuota).

---

### ✅ Checklist de Calidad e Ingeniería (GEMINI.md Obligatorio)
- [ ] **Modularidad:** Todos los archivos creados/modificados tienen menos de 150-200 líneas (SRP).
- [ ] **Cero Código Quemado:** Sin URLs absolutas, IDs hardcodeados ni strings mágicos (uso de Enums y `.env`).
- [ ] **Compilación Limpia:** `npm run build` y `dotnet build` pasan con 0 errores y 0 advertencias.
- [ ] **Rigor Científico:** Si incluye cálculos matemáticos, se verificó la validez no paramétrica contra datos de la NASA.
- [ ] **Blindaje Anti-Bots:** Endpoints de mutación protegidos con honeypot, rate limiting y filtro de User-Agent.
- [ ] **Documentación Viva:** Se actualizaron las notas en `docs/obsidian/` correspondientes a este cambio.
- [ ] **Seguridad:** Cero secretos, tokens o credenciales expuestas en el código.
