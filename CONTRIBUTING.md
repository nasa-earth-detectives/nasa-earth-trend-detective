# 🤝 Guía de Contribución y Gobernanza del Equipo

> **NASA International Space Apps Challenge 2026**  
> **Proyecto:** NASA Earth System Trend Detective  
> **Equipo:** July, Fabriany (Reving), Johan, Diego y Brayan

---

## 🌿 1. Protocolo Obligatorio de Ramas (Git Flow de 3 Ramas)

Para evitar romper el código en producción o staging, ningún desarrollador debe hacer push directo a las ramas protegidas.

### Estructura de Ramas
1. **`development`**: Rama de desarrollo activo donde se integran los Pull Requests diarios de cada participante.
2. **`qa`**: Rama de aseguramiento de calidad (Staging). Aquí el pipeline de CI/CD despliega automáticamente para pruebas de estrés y validación visual.
3. **`production`**: Rama oficial y definitiva para el jurado de la NASA. **Bloqueada contra commits directos; solo recibe merges autorizados provenientes de `qa`**.

### Flujo Diario de Trabajo
```bash
# 1. Actualizar tu rama local de desarrollo
git checkout development
git pull origin development

# 2. Crear tu rama de trabajo atómica asociada a un Issue
git checkout -b feat/nombre-tarea
# Ejemplo: git checkout -b feat/mann-kendall-engine

# 3. Desarrollar, probar localmente y verificar compilación:
npm run build
dotnet build backend/NasaTrendDetective.slnx

# 4. Crear commit convencional y subir rama
git add .
git commit -m "feat(analytics): implementar test de mann-kendall para GISTEMP"
git push -u origin feat/nombre-tarea
```

5. Abrir un **Pull Request** en GitHub hacia la rama **`development`**.
6. Solicitar revisión del compañero asignado en `CODEOWNERS`.
7. Una vez aprobado y pasados los tests automáticos, hacer **Squash & Merge**.

---

## 📝 2. Convención de Commits (Conventional Commits)

Usa siempre prefijos semánticos en minúsculas:
- `feat`: Nueva funcionalidad o componente (ej. `feat(3d): agregar capa de hexágonos en globe.gl`).
- `fix`: Corrección de un fallo o error en datos (ej. `fix(api): corregir cálculo de p-value`).
- `docs`: Modificación o creación de documentación en Obsidian o README.
- `perf`: Optimización de velocidad (ej. `perf(duckdb): indexar columnas temporales`).
- `refactor`: Limpieza de código sin cambio de comportamiento.
- `test`: Nuevas pruebas unitarias o de integración.

---

## 🛡️ 3. Estándares de Calidad Exigidos
- **Modularidad (< 150 líneas por archivo):** No crear clases ni componentes monolíticos.
- **Cero Código Quemado:** Utilizar siempre variables de entorno y Enums fuertemente tipados.
- **Documentación Viva:** Al corregir un bug o agregar un endpoint, actualizar la nota correspondiente en `docs/obsidian/` en el mismo ciclo.
