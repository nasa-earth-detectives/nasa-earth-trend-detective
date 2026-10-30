# 🎨 Integración de Habilidades de Diseño TypeUI (.agents/skills)

> **Fecha:** 2026-10-02  
> **Área:** UI/UX, Design Engineering, Customizations Antigravity  
> **Fuente Externa:** [TypeUI Design Skills](https://www.typeui.sh/design-skills) / `bergside/awesome-design-skills`

---

## 📌 Contexto y Objetivo

Para elevar la calidad estética, consistencia de diseño e interacción de clase mundial en nuestras aplicaciones (incluyendo el proyecto de la NASA y futuros desarrollos SaaS), se han importado y estandarizado **16 habilidades de diseño (skills)** directamente en el motor de personalización de la workspace: `.agents/skills/`.

Estas skills permiten a los agentes de IA (Antigravity) aplicar tokens precisos, escalas tipográficas armónicas, directrices de espaciado basadas en múltiplos de 4/8px, reglas de accesibilidad WCAG 2.2 AA y estilos estéticos específicos sin recurrir a diseños genéricos.

---

## 🗂️ Inventario de Skills Instaladas

Las skills se alojan en `.agents/skills/` y se descubren automáticamente por el entorno:

| Skill | Directorio | Enfoque Estético / Caso de Uso |
| :--- | :--- | :--- |
| **TypeUI Fundamentals** | `typeui-fundamentals/` | Principios universales de UI/UX: leyes de interacción, espaciado rítmico, tipografía y accesibilidad WCAG AA. |
| **Cosmic** | `typeui-cosmic/` | Estética sci-fi espacial, temas oscuros profundos, acentos neón y elementos inmersivos (ideal para visualizadores astronómicos). |
| **Glassmorphism** | `typeui-glassmorphism/` | Vidrio esmerilado translúcido, `backdrop-filter: blur()`, bordes sutiles con luz incidente y profundidad multicapa. |
| **Futuristic** | `typeui-futuristic/` | Interfaces tipo HUD táctico, bordes angulares, acentos de datos ciberespaciales y monitoreo en tiempo real. |
| **Sleek** | `typeui-sleek/` | Modo oscuro ultra pulido, contrastes elegantes, minimalismo refinado de alto rendimiento. |
| **Bento Grid** | `typeui-bento/` | Grillas modulares estilo Apple Bento Box, alta densidad de información con claridad visual y jerarquía balanceada. |
| **Agentic** | `typeui-agentic/` | Interfaces optimizadas para flujos con Inteligencia Artificial, telemetría de modelos, streaming y copilotos. |
| **Minimal** | `typeui-minimal/` | Tipografía suiza, contraste puro, espacio en blanco protagonista y cero ruido decorativo. |
| **Neobrutalism** | `typeui-neobrutalism/` | Sombras proyectadas duras, bordes gruesos de alto contraste y acentos vibrantes con personalidad distintiva. |
| **Shadcn** | `typeui-shadcn/` | Sistema de componentes limpio, moderno, neutral y accesible basado en Tailwind y Radix UI. |
| **Immersive** | `typeui-immersive/` | Experiencias espaciales profundas, integración tridimensional fluida y micro-interacciones suaves. |
| **Matrix** | `typeui-matrix/` | Interfaces de terminal monospaciadas, paleta fosforescente/ciberseguridad e inspección de bajo nivel. |
| **Storytelling** | `typeui-storytelling/` | Diseños guiados por narrativa visual, líneas de tiempo y recorridos secuenciales para el usuario. |
| **Premium** | `typeui-premium/` | Diseños de lujo sutil, gradientes dorados/bronce delicados, micro-interacciones y tipografía de prestigio. |
| **Modern** | `typeui-modern/` | Estándares web contemporáneos, tarjetas fluidas y micro-estados reactivos. |
| **Clean** | `typeui-clean/` | Máxima legibilidad, supresión de elementos innecesarios y superficies neutras. |

---

## 🏗️ Estructura Interna de Cada Skill

Cada habilidad cuenta con dos componentes principales:
1. `SKILL.md`: Instrucciones y directivas concretas para el agente de IA:
   - **Mission & Brand**: Definición de la personalidad visual.
   - **Style Foundations**: Escalas tipográficas recomendadas (p. ej. `Audiowide`, `Inter`, `JetBrains Mono`), paletas de color con tokens semánticos y múltiplos de espaciado (`4/8/12/16/24/32`).
   - **Accessibility Standards**: Cumplimiento WCAG 2.2 AA, navegación por teclado y contraste mínimo 4.5:1.
   - **Rules (Do & Don't)**: Reglas estrictas de lo que se debe y no se debe hacer.
2. `DESIGN.md`: Documento de acompañamiento para diseñadores e ingenieros, detallando la filosofía de diseño, tokens CSS y criterios de mantenimiento.
3. En `typeui-fundamentals/`, guías especializadas:
   - `ui-principles.md` (Jerarquía visual y contraste).
   - `spacing-principles.md` (Ritmo vertical y horizontal, cuadrícula de 4pt).
   - `ux-principles.md` (30 leyes de UX y contratos de estado de controles).
   - `typography-principles.md` (Escalas modulares y legibilidad).
   - `accessibility.md` (Auditorías WCAG 2.1/2.2).

---

## 🚀 Cómo Utilizarlas en Próximos Diseños

Cuando se requiera crear o rediseñar una interfaz, modal, dashboard o componente:
- Basta con indicar el estilo deseado (ej. *"Aplica el estilo typeui-cosmic para el panel de telemetría"* o *"Usa typeui-bento para las tarjetas del dashboard"*).
- El agente cargará automáticamente las directivas y tokens correspondientes de `.agents/skills/typeui-<slug>/`, garantizando fidelidad estética y respeto al protocolo de no hardcoding y accesibilidad.
