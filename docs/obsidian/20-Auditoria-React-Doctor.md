# 🩺 Auditoría de Código React con React Doctor (Oxlint)

- **Workflow:** `.github/workflows/react-doctor.yml`
- **Acción Oficial:** `millionco/react-doctor@v2`
- **Motor Subyacente:** Oxlint (Linter hiper-optimizado en Rust)
- **Creador:** Million.js / Aiden Bai
- **Relacionado:** [[00-Map-Of-Content]], [[06-Pipeline-CI-CD]], [[07-Estandares-Ingenieria]], [[14-Agente-Revisor-PR-GitHub-Actions]]

---

## 🎯 Objetivo de la Auditoría

**React Doctor** actúa como un revisor de código especializado para aplicaciones React modernas, diseñado para atrapar anti-patrones que los linters tradicionales (como ESLint básico) no detectan:

1. **Rendimiento y Re-renderizados:** Cálculos pesados no memoizados dentro del render, recreación innecesaria de funciones y fugas de estado.
2. **Ciclo de Vida de Hooks:** Uso incorrecto de `useEffect` para sincronizar estados que deberían ser derivados o controlados por eventos.
3. **Compatibilidad con React 19:** Doble montaje de `StrictMode`, compatibilidad con React Compiler y concurrencia.
4. **Accesibilidad (a11y):** Elementos interactivos sin etiquetas accesibles, roles inválidos y fallas de contraste.
5. **Arquitectura y Limpieza:** Código muerto, dependencias circulares y prop drilling excesivo.

---

## 📊 Health Score (0 - 100)

React Doctor evalúa el código modificado y genera un puntaje de salud cuantitativo:

| Rango de Score | Estado | Significado | Acción Requerida |
| :---: | :---: | :--- | :--- |
| **85 - 100** | 🟢 Excelente | Código React limpio, modular y de alto rendimiento. | Listo para merge directo. |
| **70 - 84** | 🟡 Aceptable | Hallazgos menores o advertencias de optimización. | Recomendada revisión antes de QA. |
| **< 70** | 🔴 Crítico | Anti-patrones severos, fugas o regresiones. | Bloqueo preventivo de PR hasta corrección. |

---

## ⚙️ Integración Continua (GitHub Actions)

El workflow se activa automáticamente en cada Pull Request que altere archivos dentro de `frontend/**`:

```yaml
name: React Doctor Code Review
on:
  pull_request:
    branches: [development, qa, production]
    paths: ['frontend/**', 'packages/**']
```

- **Diff Mode Inteligente (`diff: ${{ github.base_ref }}`):** Solo analiza las líneas añadidas o modificadas en el PR. No genera ruido sobre código preexistente no tocado.
- **Feedback Directo:** Publica el informe directamente como comentario de revisión en el Pull Request.

---

## 💻 Ejecución Local bajo Demanda

Cualquier miembro del equipo puede ejecutar la auditoría en su entorno de desarrollo:

```bash
# Ejecutar auditoría del frontend con reporte detallado
npm run doctor

# O mediante npx directo
npx -y react-doctor@latest frontend --verbose
```
