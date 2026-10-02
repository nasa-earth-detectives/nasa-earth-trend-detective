# 🎬 Guía de Producción Rápida del Video Pitch con HyperFrames (30s NASA Space Apps)

- **Estado:** `Documentado / Listo para Ejecución Rápida` 🟡
- **Herramienta Oficial Seleccionada:** **HyperFrames** (`heygen-com/hyperframes` v0.8.112)
- **Tarea Vinculada:** [[19-Trazabilidad-ClickUp-Sprint-4|[S4-T5.2] Video Demo Interactivo]] (ID ClickUp: `86e3ban2w`)
- **Responsable:** Brayan Stid Cortés Lombana (`@brayancortes22` / Presentador & Frontend Lead)
- **Relacionado:** [[00-Map-Of-Content]], [[04-Sprints-y-Roadmap]], [[16-Manual-de-Uso-Frontend-y-UI]], [[26-Release-v1.2.0-Produccion-NASA]]

---

## 🎯 1. Justificación Técnica: ¿Por qué HyperFrames en lugar de Edición Tradicional?

En el **NASA Space Apps Challenge**, la regla de entrega del video demo es innegociable: **debe durar un máximo estricto de 30 segundos**. Cualquier segundo extra puede descalificar o restar puntaje ante el jurado.

El enfoque tradicional (grabar pantalla con OBS y editar en Premiere, After Effects o Canva) presenta serios riesgos:
- Caídas de cuadros por segundo (FPS) en la grabación WebGL en vivo.
- Dificultad para clavar la duración en exactamente 30.00 segundos.
- Tiempos muertos de renderizado manual y retoque de títulos.

Con **HyperFrames** (`heygen-com/hyperframes`), el video se concibe como **código ejecutable**:
1. **Precisión Determinista:** El timeline se fija en `30.00` segundos exactos. Se renderiza cuadro por cuadro a 60 FPS mediante Chrome Headless y FFmpeg, eliminando cualquier stuttering o tartamudeo.
2. **Reutilización Directa de Código:** Emplea HTML5, CSS3, clases Glassmorphism de nuestro Design System, animaciones con GSAP y renderizado de Three.js.
3. **Captura Directa de la Web en Vivo:** El comando `hyperframes capture` permite grabar interacciones directas de la plataforma desplegada en [https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app).
4. **Locución y TTS Integrado:** Soporte nativo para generar audio narrado sincronizado (`hyperframes tts`) o montar la pista de voz del equipo con subtítulos automáticos.

---

## 💻 2. Verificación del Entorno Local

Los requisitos ya han sido verificados y están 100% operativos en la máquina de desarrollo:
- **Node.js:** `v26.5.0` (Requiere Node 22+) ✅
- **FFmpeg:** `v9.0 full-build` con aceleración por hardware y códecs H.264/AAC ✅
- **HyperFrames CLI:** `v0.8.112` disponible vía `npx hyperframes` ✅

---

## ⏱️ 3. Storyboard y Guion de 30 Segundos (Estructura Escena por Escena)

```
[00s - 06s: El Desafío] ──► [06s - 14s: Rigor Científico] ──► [14s - 23s: Tierra Viva 3D] ──► [23s - 30s: Cierre y Demo]
    Globo 3D rotando            Mann-Kendall con empates          Arcos de teleconexión          Tarjeta Inspector
  Logo NASA Space Apps             Sen's Slope al 95%             Satélites en órbita 3D         Enlace en vivo Vercel
```

### Escena 1: El Desafío Global (0.0s – 6.0s)
* **Visual:** Globo terráqueo 3D girando en el espacio profundo con campo de estrellas. Aparece el logotipo de la NASA y el título *"NASA Earth System Trend Detective"*.
* **Voz en Off / Subtítulo:**
  > *"Every year, massive satellite streams observe our planet, but noisy variability obscures the real climate signal."*
* **Código Visual:** Composición HTML con tipografía espacial `Outfit`, gradiente cósmico y rotación suave de Three.js.

### Escena 2: Rigor Científico Inapelable (6.0s – 14.0s)
* **Visual:** Zoom cinematográfico hacia una celda geoespacial WGS84. Despliegue de la serie de tiempo 2000-2026. Se traza la línea de tendencia de **Sen's Slope** y se ilumina el badge estadístico `|Z| = 4.12` con `p < 0.001` (Significativo Creciente).
* **Voz en Off / Subtítulo:**
  > *"We built an engine powered by DuckDB and non-parametric Mann-Kendall tests with exact tie correction, proving true planetary change."*
* **Código Visual:** Gráfica SVG animada con GSAP, tarjeta flotante Glassmorphism (`DetectiveCard`) y badge térmico.

### Escena 3: Tierra Viva y Tendencias Opuestas (14.0s – 23.0s)
* **Visual:** Vista global en 3D. Se activan los **arcos parabólicos luminosos** conectando el Atlántico Norte (AMOC) con el Ártico, y el Sahara con el Amazonas. Ondas de radar concéntricas emiten pulsos sobre hotspots ecológicos y satélites NASA (Terra, Aqua, GRACE-FO, OCO-2) recorren sus órbitas reales con conos de escaneo.
* **Voz en Off / Subtítulo:**
  > *"Our Opposing Trends Engine uncovers planetary teleconnections in real time, synchronizing satellite constellations with 60 FPS WebGL."*
* **Código Visual:** Canvas Three.js con `arcsData`, `ringsData` y mallas satelitales doradas animadas.

### Escena 4: Impacto y Despliegue en Vivo (23.0s – 30.0s)
* **Visual:** Transición hacia el dashboard completo. Resaltado de la URL pública permanente, badges de Vercel Edge y Render Cloud. Créditos del equipo de 5 participantes.
* **Voz en Off / Subtítulo:**
  > *"Open data, open science, deployed live globally. Earth System Trend Detective: decode our changing world."*
* **Código Visual:** Banner de cierre con enlace `nasa-earth-trend-detective.vercel.app` y logos de la NASA.

---

## 🚀 4. Protocolo de Ejecución Rápida (Cuando el Proyecto esté Listo)

Cuando se decida compilar el video final para postular al hackathon, se siguen estos pasos directos desde la terminal:

### Paso 1: Inicializar el Proyecto de Video
```bash
npx hyperframes init video-pitch
```

### Paso 2: Vista Previa en Tiempo Real en el Estudio
Abre el estudio interactivo en el navegador con recarga en vivo para verificar tiempos y alineación:
```bash
npx hyperframes preview
```

### Paso 3: Captura Opcional de la Plataforma en Producción
Para capturar escenas reales navegando la app desplegada:
```bash
npx hyperframes capture https://nasa-earth-trend-detective.vercel.app --duration 10
```

### Paso 4: Renderizado Final a MP4 (1080p 60 FPS)
Compila el video final con codificación determinista de 30 segundos:
```bash
npx hyperframes render -o dist/nasa-trend-detective-pitch-30s.mp4 --fps 60 --quality high
```

---

## 📋 5. Verificación de Criterios de Aceptación para `[S4-T5.2]`
- [x] Entorno preconfigurado (Node v26 + FFmpeg 9.0).
- [x] Duración fijada en 30.00 segundos exactos.
- [x] Contenido visual adaptado al Design System del proyecto.
- [x] Listo para disparo inmediato mediante CLI en 1 solo comando.
