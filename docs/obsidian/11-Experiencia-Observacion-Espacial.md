# Experiencia de observación espacial

Volver al [[00-Map-Of-Content]] · Arquitectura: [[01-Arquitectura-Monorrepo]]

## Alcance local

La interfaz se organiza por intención sobre una única escena Globe.gl. Esta fase
modifica composición, controles y movimiento. No incorpora texturas NASA, nubes,
luces nocturnas, mapas de calor ni cambios al backend.

## Modos

- **Observación:** contexto científico arriba, año como entrada temporal e índice
  Variables / Tiempo / Escena. Tras cinco segundos, la instrumentación se atenúa.
- **Variables:** el instrumento científico se despliega a la derecha. La cámara
  desplaza su proyección a la izquierda sin mover el canvas. Las cuatro variables
  soportadas cambian filtro, metadatos y acento. Nivel del mar permanece deshabilitado.
- **Tiempo:** el año viaja al archivo temporal; aparecen escala anual, transporte,
  reinicio y cierre. Recorrer avanza el filtro entre 2002 y 2024; cerrar pausa.
- **Escena:** interruptores reales de rotación, estrellas, retícula y atmósfera.
- **Inspección:** un clic sobre la Tierra o «Inspeccionar centro» muestra latitud y
  longitud reales. La serie de ejemplo está identificada como sintética; el análisis
  estadístico regional sigue pendiente y no muestra confianza ni significancia ficticias.

## Componentes y estado

- `ImmersiveEarthLayout`: composición y conexión de instrumentos con la API de escena.
- `useImmersiveUi`: modo exclusivo y ubicación seleccionada, separado del filtro científico.
- `ModeNavigator`: índice por intención y accesos de órbita e inspección por teclado.
- `ObservationContext`, `MissionHeader`, `SystemReadout`: contexto, firma y datos de conexión.
- `LayerPanel`, `VariableLayerList`, `ViewOptionsList`: instrumentación científica y visual.
- `TimeNavigator`, `useTimelinePlayback`: archivo temporal y avance anual estable.
- `DetectiveCard`: coordenadas, producto de referencia y serie de demostración explícita.
- `TimeSeriesChart`: SVG con acento contextual y selección anual accesible por teclado y tacto.
- `useIdleUi`: reposo suspendido por instrumento abierto, reproducción, foco visible,
  hover, puntero presionado, interacción táctil o preferencia de movimiento reducido.

## Movimiento y materiales

La identidad usa una firma tipográfica abierta, un raíl con el acento de la variable
activa y crédito secundario. El acceso a la guía conserva sus identificadores de
recorrido y usa un control de 44 px con foco visible y excepción de reposo.
En móvil se abrevia a «Guía» y se oculta la edición; no usa cápsula, cian fijo,
brillo ni indicadores animados de conexión.

La guía usa el mismo material mineral. Cada paso apunta al control descrito:
Guía, contexto actual, Variables, Escena, archivo temporal e inspector.
`guidedTourService` prepara el modo antes de resaltar; `tourTarget` espera el
montaje y la estabilización de la caja y las transiciones finitas, con cancelación
y límite de dos segundos. No se modifica la posición CSS del objetivo ni se
eleva su contenedor sobre el overlay. Driver conserva el cálculo de la flecha.
El recorrido suspende Idle, admite anterior/siguiente y Escape devuelve el foco
a Guía. El inspector usa la selección existente o el centro real de la cámara;
la descripción identifica sus datos actuales como demostrativos.

El inspector usa `inspection.css`: carbón mineral, coordenadas abiertas, producto
de referencia y un gráfico del mismo acento científico. `inspection-chart.css`
controla la línea sin relleno brillante, los ejes y la lectura de año/valor.
La serie sintética conserva el rango global 2002–2024. No se atribuye a NASA ni
se muestra un p-valor fijo, «95% de confianza» o una resolución espacial inventada.
El panel conserva `tour-detective-card`, cierre con Escape y retorno de foco;
cambiar el año no vuelve a enfocar el botón de cierre.

Los tokens en `index.css` gobiernan duración y curvas. El acento registrado con
`@property` interpola entre variables científicas. Los estilos se separan por
responsabilidad en `styles/workspace.css`, `instrument-chrome.css`, `layers.css`
y `timeline.css`.

El año usa una transición FLIP con Web Animations. La selección científica retrae
el raíl anterior, desplaza el marcador y cambia los metadatos. El desplazamiento
de proyección sólo mantiene un RAF durante su transición; no hay estado React por
fotograma. Movimiento reducido evita FLIP, escalonados y desplazamiento animado.

## Escena estable y selección

`useGlobeScene` conserva la instancia de Globe.gl, controles, ResizeObserver y
StarField. `ScenePreferences` refleja los interruptores a través de una referencia
estable. Abrir instrumentos y cambiar filtros no recrea la escena.

`surfaceSelection.ts` calcula la intersección con `toGlobeCoords` al terminar un
tap válido. Descarta arrastre, cancelación y multitouch; evita depender del hover
del fotograma previo. Sus listeners se retiran al desmontar.

## Adaptación y acceso

Desktop usa el índice lateral contextual y una regla temporal de ancho `clamp()`.
Tableta y móvil colocan el índice bajo la órbita; Variables y Escena se abren como
hoja inferior. En vertical, la proyección del planeta sube para mantenerlo visible.
En teléfono los metadatos de unidad se integran en la fila activa.

Los controles conservan foco visible, radios y tabs navegables con flechas,
`aria-checked`, `aria-selected`, `aria-expanded`, Escape y retorno del foco.
Las superficies cerradas usan `inert`; los controles táctiles tienen objetivos
de al menos 44 px de alto.

## Validación local

Ejecutar `npm run type-check --workspace=frontend` y
`npm run build --workspace=frontend`. El script de lint declarado requiere ESLint,
que no está instalado actualmente. La validación visual cubre 2560×1440,
1920×1080, 1440×900, 1366×768, 1024×768, 768×1024 y 390×844.

El estado «Modo local» informa que la API no está conectada. La Phase 2 incorpora
la base NASA descrita en [[12-Superficie-Terrestre-NASA]]; cambiar el año todavía
no genera una visualización de datos sobre su superficie.

## Identidad de observación terrestre

La firma del producto usa un horizonte seccionado; los instrumentos comparten
los símbolos T°, NDVI, H₂O y XCO₂. `observationLenses.ts` centraliza dominio,
foco y símbolo de cada perspectiva sin alterar el contrato de datos.
`ObservationSection` representa esquemáticamente superficie, vegetación, agua
y columna atmosférica. No es una gráfica de mediciones y no tiene escala.

La composición distingue tres densidades: ficha científica con fuente/unidad,
planeta abierto y mandos compactos. Al abrir el catálogo la ficha se reduce al
ámbito activo. Tableta dispone las referencias junto al esquema; móvil conserva
símbolo, dominio, fuente y unidad en un bloque compacto. La marca permanece visible.

El navegador temporal muestra el **año de consulta**, no un registro confirmado.
2002–2024 es el rango configurado de exploración, no cobertura validada de cada
producto. Los botones −1/+1 respetan los límites y pausan la reproducción al
cambiar manualmente; el slider también pausa al manipularlo.

`SystemReadout` cuenta **registros recibidos**, no celdas geográficas. La petición
actual utiliza sólo `variable` y `year`. Carga, error y respuesta vacía tienen
lecturas diferentes; `useGlobeData` descarta el conteo anterior al cambiar la
consulta. La disponibilidad de API no acredita la procedencia NASA de una respuesta.

La validación de esta fase está en `output/playwright/identity-validate.cjs`,
`identity-data-validation.cjs` e `identity-additional.cjs`. Los datos sintéticos
de QA sólo existen en rutas interceptadas dentro del navegador de prueba.

### Archivos de esta fase de identidad

Nuevos: `frontend/src/config/observationLenses.ts` y
`frontend/src/components/Mission/ObservationSection.tsx`.

Modificados:

- `frontend/src/components/Layout/ImmersiveEarthLayout.tsx`
- `frontend/src/components/Mission/ObservationContext.tsx`
- `frontend/src/components/Mission/MissionHeader.tsx`
- `frontend/src/components/Mission/SystemReadout.tsx`
- `frontend/src/components/Rail/ModeNavigator.tsx`
- `frontend/src/components/Layers/LayerPanel.tsx`
- `frontend/src/components/Layers/VariableLayerList.tsx`
- `frontend/src/components/Controls/TimeNavigator.tsx`
- `frontend/src/components/Inspector/LocationInstrument.tsx`
- `frontend/src/styles/instrument-chrome.css`
- `frontend/src/styles/workspace.css`
- `frontend/src/styles/layers.css`
- `frontend/src/styles/timeline.css`
- `frontend/src/hooks/useGlobeData.ts`
- `frontend/src/pages/DashboardPage.tsx`
- `frontend/src/config/climateLayers.ts` (aclaración del rango configurado)
- Este documento.

Los scripts y capturas `output/playwright/identity-*` documentan la revisión.
La fase no cambia motores, materiales de la esfera, dependencias ni backend.
