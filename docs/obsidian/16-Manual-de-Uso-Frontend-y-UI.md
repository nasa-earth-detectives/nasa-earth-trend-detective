# 📖 Manual de Uso e Interacción: Frontend & UI Espacial

- **Autor:** Brayan Stid Cortés Lombana (`bscl` / Frontend Lead & UI/UX)
- **Tareas Relacionadas:** [[11-Trazabilidad-ClickUp-Sprint-1|[S1-T5] Design System]], [[15-Trazabilidad-ClickUp-Sprint-2|[S2-T5] Inspector de Detective]]
- **Relacionado:** [[00-Map-Of-Content]], [[05-Rigor-Cientifico-MannKendall]], [[11-Experiencia-Observacion-Espacial]]

---

## 🌌 1. Design System Espacial y Componentes Base (`[S1-T5]`)

### 1.1 Filosofía de Diseño
El Design System de *NASA Earth System Trend Detective* simula una estación orbital de análisis científico. Combina la oscuridad profunda del espacio exterior (`cosmic-void: #05070a`) con acentos lumínicos de instrumentación de cabina y superficies de vidrio translúcido (*Glassmorphism*) con desenfoque de fondo (*Backdrop Blur*).

### 1.2 Componente `GlassPanel`
Es el contenedor universal para todos los instrumentos flotantes.

```tsx
import { GlassPanel } from '@/components/UI/GlassPanel';

// Variante estándar: Instrumentos ligeros, paneles laterales
<GlassPanel variant="standard" className="p-4">
  <p>Contenido translúcido</p>
</GlassPanel>

// Variante profunda (deep): Tarjetas de análisis e inspectores
<GlassPanel variant="deep" className="p-6">
  <p>Panel con mayor opacidad y contraste para gráficos</p>
</GlassPanel>

// Variante con brillo reactivo (glow): Indicadores de misión o alertas
<GlassPanel variant="glow" glowColor="rgba(14, 165, 233, 0.25)" className="p-4">
  <p>Borde con aura luminiscente NASA Cyan</p>
</GlassPanel>
```

### 1.3 Componente `StatusBadge`
Representa el estado operativo de los instrumentos o satélites:

```tsx
import { StatusBadge } from '@/components/UI/StatusBadge';

<StatusBadge variant="active" label="En Órbita" pulse />
<StatusBadge variant="nominal" label="Telemetría Nominal" />
<StatusBadge variant="warning" label="Anomalía Térmica" pulse />
<StatusBadge variant="standby" label="En Espera" />
```

### 1.4 Barra de Control de Misión (`MissionHeader`)
Ubicada en la parte superior izquierda de la pantalla (`top: 35px`, `left: var(--gutter)`):
- Muestra las insignias de misión NASA Space Apps 2026.
- Indica el estado de conexión con la infraestructura satelital en tiempo real.
- Permite identificar el módulo activo de telemetría.

---

## 🕵️‍♂️ 2. Inspector de Detective Regional (`[S2-T5]`)

### 2.1 Activación del Inspector
1. **Selección en el Globo:** El usuario hace clic sobre cualquier punto de la superficie terrestre.
2. **Coordenadas de Selección:** El motor geoespacial detecta la latitud y longitud exacta del punto tocado y abre automáticamente el panel `DetectiveCard`.
3. **Desplazamiento Dinámico de Cámara:** La cámara ajusta suavemente su proyección lateral (`focusOffset`) para que el planeta no quede tapado por la tarjeta de análisis.

### 2.2 Anatomía del inspector

El panel usa carbón mineral, texto cálido y el acento de la variable seleccionada.
Una sola superficie contiene:

- **Inspección regional:** título y cierre con objetivo táctil de 44 px.
- **Coordenadas reales:** latitud y longitud del punto seleccionado.
- **Variable y producto de referencia:** contexto de la observación, no atribución de los datos de ejemplo.
- **Serie de ejemplo (2002–2024):** gráfico sintético para probar navegación anual.
- **Procedencia:** «Datos sintéticos · no son observaciones NASA» y «Mann–Kendall / Sen · Sin calcular».

En móvil se compactan espacios y la superficie permanece dentro del viewport;
si la altura es limitada, el desplazamiento queda dentro del inspector.

### 2.3 Estado del análisis estadístico

El inspector todavía no recibe resultados regionales del backend. Los valores
fijos de p-valor, Z y pendiente del prototipo no se presentan como resultados
calculados, y se retiraron sus badges de significancia y confianza.

`TrendSignificanceBadge` sigue disponible como componente separado para una
integración futura. Su existencia no implica que el análisis esté conectado.

### 2.4 Interacción con el gráfico de series temporales

- SVG ligero, línea contextual sin resplandor ni relleno azul fijo.
- Lectura del año y valor de ejemplo junto con la unidad seleccionada.
- Selección anual accesible por teclado y tacto, sincronizada con el año global.
- El rango coincide con `SATELLITE_TIMELINE`; cambiar el año conserva el foco.
- No se afirma una tasa de FPS sin medición.
---

## ♿ 3. Accesibilidad y Atajos de Teclado

* **Cierre Inmediato:** Presionar la tecla `Escape` (`Esc`) cierra inmediatamente el Inspector de Detective y regresa la cámara a la órbita general.
* **Navegación por Teclado:** Se puede tabular (`Tab` y `Shift + Tab`) hacia el botón de cierre y los controles de inspección sin perder el foco ni desbordar la pantalla.
* **Soporte `prefers-reduced-motion`:** Los usuarios con sensibilidad al movimiento tienen desactivadas automáticamente las animaciones de pulso y las transiciones bruscas de cámara.

---

## 🚀 4. Manual de Uso Interactivo: Tour Guiado de Misión (`driver.js`)

Inspirado en la experiencia de usuario interactiva implementada en *Accesorios Lilís*, la estación orbital integra un sistema de **recorrido guiado (*Walkthrough*)** basado en la librería `driver.js: ^1.8.0`, adaptado estéticamente con una atmósfera de telemetría espacial profunda (*Deep Space Glassmorphism*).

### 4.1 Activación del Recorrido Guiado
- **Botón en Cabecera:** Al pulsar el botón **"Guía de Misión"** (`#tour-launch-button`) ubicado en la esquina superior izquierda (`MissionHeader`), se despliega el foco *spotlight* sobre la estación orbital.
- **Persistencia en LocalStorage:** El sistema registra si el usuario ya completó el recorrido (`nasa_mission_tour_seen`).

### 4.2 Pasos del Recorrido Cósmico

```
[ Paso 1: MissionHeader ] ──➔ [ Paso 2: ObservationContext ] ──➔ [ Paso 3: ModeNavigator ]
                                                                          │
                                                                          ▼
[ Paso 5: DetectiveCard ] ◀── [ Paso 4: TimeNavigator ] ◀─────────────────┘
```

1. **Paso 1 · Control de Misión & Telemetría (`#tour-mission-header`):**
   - Resalta la insignia de misión de la NASA, el estado del enlace de datos satelitales y explica el objetivo de la plataforma *Trend Detective*.
2. **Paso 2 · Coordenadas & Dominio Activo (`#tour-observation-context`):**
   - Presenta la perspectiva terrestre en monitoreo, la misión satelital activa (MODIS, CERES, Landsat) y las unidades de medida físicas.
3. **Paso 3 · Instrumentos de Navegación (`#tour-mode-navigator`):**
   - Instruye al usuario en el uso de los 4 accesos rápidos: selección de variables climáticas, línea de tiempo, parámetros de escena 3D e inspección de superficie.
4. **Paso 4 · Línea Temporal Satelital (`#tour-time-navigator`):**
   - Explica cómo navegar entre los años 2000 y 2026, y cómo iniciar la reproducción continua para observar la evolución ambiental.
5. **Paso 5 · Inspector Científico: Trend Detective (`#tour-detective-card`):**
   - El servicio ejecuta el callback `onOpenInspector()` para abrir automáticamente la tarjeta analítica si estaba oculta.
   - Enseña la interpretación del test de Mann-Kendall, la pendiente de Sen, la evaluación del $p$-valor y la exploración táctil de la serie de tiempo en SVG.

### 4.3 Navegación y Atajos de Teclado del Tour
- **Avanzar:** Clic en `Siguiente ➔` o pulsar la tecla **Flecha Derecha** (`➔`).
- **Retroceder:** Clic en `⬅ Anterior` o pulsar la tecla **Flecha Izquierda** (`⬅`).
- **Salir:** Clic en la `✕` superior, clic en el fondo oscurecido o pulsar la tecla **`Escape`** (`Esc`).
- **Finalizar:** Clic en `✓ Finalizar Misión` en el último paso.

