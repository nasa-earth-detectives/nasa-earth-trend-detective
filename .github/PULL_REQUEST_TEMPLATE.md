## 🌍 NASA Earth System Trend Detective - Pull Request

### 📌 Referencia del Issue
Closes #<!-- Número del Issue, ej. #12 -->

---

### 🏷️ Tipo de Cambio
- [ ] `feat`: Nueva funcionalidad o módulo
- [ ] `fix`: Corrección de bug o anomalía de datos
- [ ] `docs`: Documentación técnica (Obsidian / README)
- [ ] `perf`: Optimización de rendimiento (WebGL 60 FPS / DuckDB < 50ms)
- [ ] `refactor`: Refactorización modular sin alterar comportamiento

---

### 🎯 Descripción del Cambio
<!-- Explicación concisa del cambio y motivación técnica -->

---

### 🌿 Rama de Destino
- [ ] `development` (Desarrollo diario y nuevas features)
- [ ] `qa` (Staging de aseguramiento de calidad antes de entrega)
- [ ] `production` (Versión oficial de entrega al jurado de la NASA)

---

### ✅ Checklist de Calidad e Ingeniería (Obligatorio)
- [ ] **Modularidad:** Todos los archivos creados/modificados tienen menos de 150-200 líneas (SRP).
- [ ] **Cero Código Quemado:** Sin URLs absolutas, IDs harcodeados ni strings mágicos (uso de Enums y `.env`).
- [ ] **Compilación Limpia:** `npm run build` y `dotnet build` pasan con 0 errores y 0 advertencias.
- [ ] **Rigor Científico:** Si incluye cálculos matemáticos, se verificó la validez no paramétrica contra datos de la NASA.
- [ ] **Documentación Viva:** Se actualizaron las notas en `docs/obsidian/` correspondientes a este cambio.
- [ ] **Seguridad:** Cero secretos, tokens o credenciales expuestas.
