# Entorno espacial, satélites reales y alta resolución Esri

Volver al [[00-Map-Of-Content]] · Superficie: [[30-Detalle-Satelital-por-Mosaicos-LOD]]
· Datos: [[31-Datos-GISTEMP-Reales-e-Integracion-API]]

> Actualizado en [[33-Satelites-NASA-Luna-y-Esri-Global]]: satélites con los modelos oficiales de la NASA,
> Luna, arcos continuos (sin pulso), corrientes apagadas por defecto y Esri también de noche.

## Alcance

Diego pidió dejar la Tierra y el espacio como una imagen de referencia y rehacer las capas vivas
de la S3-T4:

- borde atmosférico azul intenso y destello del sol;
- más estrellas y Vía Láctea;
- satélites 3D con conos de escaneo y órbitas punteadas;
- arcos finos de colores con anillos;
- poder acercarse hasta ver coches, barcos y casas.

La interfaz no cambia.

## Qué hay ahora

| Capa | Archivo | Qué hace |
| --- | --- | --- |
| Halo atmosférico | `earthAtmosphere.ts` | Esfera aditiva (1,10 R). Para cada píxel calcula a qué altura pasa el rayo de visión y aplica un brillo exponencial (altura de escala 0,011 R). Es azul de día, tenue de noche y naranja en el terminador; a contraluz se enciende el limbo. Sustituye a la atmósfera genérica de Globe.gl, que no conocía el sol. |
| Estrellas | `starField.ts` | 13.450 estrellas en 4 capas (antes 1.620), con semilla fija, color por temperatura y sprite redondo. Una capa se concentra en el plano galáctico. El cielo gira con el tiempo sidéreo real (GMST). |
| Vía Láctea | `milkyWay.ts` | Banda procedural horneada una vez en la GPU a una textura de 2048×1024 (1024 en táctil). Usa la geometría real: polo y centro galácticos J2000. No es un mapa del cielo. |
| Sol | `earthSunGlare.ts` | Disco con halo en la dirección real del sol y `Lensflare` de three. El destello desaparece cuando la Tierra tapa el sol (comprobado). Va con el interruptor de estrellas. |
| Satélites | `earthSatelliteOrbits.ts`, `satelliteMissions.ts`, `satelliteModel.ts`, `satelliteScan.ts` | Terra, Aqua, OCO-2 y GRACE-FO con altitud, inclinación y periodo nominales de la NASA. Los tres heliosíncronos orientan su plano según la hora local del nodo y el sol real. Llevan modelo 3D (lámina dorada, alas solares, antena) y cono de escaneo con huella; la órbita va punteada y con estela. |
| Arcos y anillos | `earthTeleconnectionArcs.ts`, `earthRadarRipples.ts`, `services/teleconnectionService.ts` | Trazo base fino más un pulso de luz y un punto en cada extremo; los anillos van del color del arco. Los 3 pares salen de `/api/trends/opposing` (con copia local) y se añaden 2 procesos físicos rotulados como ilustrativos. |
| Corrientes | `earthOceanFlow.ts` | Mismos datos, con trazo fino, cálida/fría con transparencia y guiones más lentos. |
| Esri World Imagery | `earthTileConfig.ts`, `earthDetailTiles.ts` | Si existe `VITE_ESRI_API_KEY`, sustituye a Landsat de nivel 9 a 19 (≈0,3 m/px) y la cámara baja a 250 m. Sin clave no cambia nada. |

### Lo que es ilustrativo, dicho claro

- **Satélites:** la altitud se exagera ×3 y el tiempo ×90 (una vuelta en ~66 s). El modelo es
  genérico. El nodo de GRACE-FO es ilustrativo.
- **Arcos:** las series que acompañan a los pares de `/api/trends/opposing` siguen siendo
  sintéticas en el backend; los arcos sólo conectan las regiones.

## Correcciones de paso

- **Satélites de la S3-T4:**
  - Cada uno tenía su propio `requestAnimationFrame`, que seguía corriendo con la capa oculta.
  - Al desmontar sólo se liberaban las órbitas.
  - Ahora la animación va en el `onBeforeRender` de la capa (oculta = no calcula) y `dispose`
    libera geometrías, materiales, texturas y el mapa de entorno.
- **Triángulos oscuros en las nubes a media altura (fallo de la nota 30):** los mosaicos
  escribían profundidad con `polygonOffset`, que crece con la inclinación del triángulo. Eso los
  adelantaba a la capa de nubes (1,0012 R) y la recortaba. Ahora los mosaicos no escriben
  profundidad.
- **Bruma Fresnel retirada:** una segunda esfera a 1,0016 R producía un muaré en panal de abeja
  sobre el lado de día. El halo solo basta.

## Alta resolución Esri

Verificado el 2026-10-05 en developers.arcgis.com:

- Plantilla:
  `https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=…`
- CORS `*` comprobado con GET y cabecera Origin.
- Atribución obligatoria y siempre visible: **"Powered by Esri"** y **"Esri, Maxar, Earthstar
  Geographics, and the GIS User Community"**. Está en el crédito de la esquina, que aparece
  siempre que hay mosaicos activos.

Cómo se activa:

- La clave va en `frontend/.env.local` (no versionado; plantilla en `frontend/.env.example`).
- Queda dentro del JavaScript público, así que hay que **restringirla por dominio** en ArcGIS.
- Precio verificado: 2M mosaicos/mes gratis, luego 0,15 USD por 1.000.

Probado sin clave real:

- Se usó un build temporal con una clave ficticia y Edge sin ventana redirigiendo las peticiones
  al servidor público de la misma imagen. El código no se tocó.
- Resultado: 124 mosaicos de nivel 19. En el puerto de Singapur se ven contenedores, grúas,
  barcos y camiones; en Shibuya, el cruce y los vehículos.

Cosas a saber:

- El nivel 19 se pide por debajo de unos 390 m (32/2^19 radios). Por eso la cámara mínima es
  250 m y el plano cercano baja hasta 0,0004.
- Con Esri, las capas de mosaicos se pegan a 13-25 m (antes 127-255 m) para no quedar por
  encima de la cámara.
- **Sólo de día:** como el resto del globo, la capa de detalle se apaga en la cara nocturna (sol
  real). De noche, al acercar, se ven las luces de VIIRS, no los coches.

### Activación local con clave real — 2026-10-05

Diego completó el registro directo de ArcGIS Location Platform. Se creó la credencial
**Earth Trend Detective - World Imagery local** en su portal `diego-earth.maps.arcgis.com`.
El valor de la clave está exclusivamente en `frontend/.env.local`, ignorado por Git; no debe
copiarse a esta documentación ni a Obsidian. Vite se reinició en `http://127.0.0.1:3000/`.

- Aplicación pública, sin acceso a elementos privados, análisis ni administración.
- Único privilegio: **Basemap styles service** (`premium:user:basemaps`).
- Caducidad mostrada por ArcGIS: **3 de enero de 2027**.
- Orígenes permitidos: `http://127.0.0.1:3000`, `http://localhost:3000`,
  `http://127.0.0.1:4173` y `http://localhost:4173`.
- El panel mostró **Pay-as-you-go disabled**. No se añadió método de pago ni se activó
  facturación por uso. La clave no está habilitada para Vercel; no hubo despliegue.

Validación de autenticación contra el endpoint oficial
`https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/webmaps/arcgis/imagery`:

- Clave real y origen local permitido: HTTP 200 y webmap válido.
- Misma clave y un origen externo no permitido: HTTP 401, error ArcGIS 498.
- Token deliberadamente inválido: HTTP 401, error ArcGIS 498.

Los mosaicos World Imagery de nivel 19 respondieron JPEG. Sin embargo, su endpoint directo
también devolvió imágenes en controles con token inválido/origen ajeno, mientras que sin token
respondió error 499. Por ello los JPEG **no se usaron como prueba de autenticación**; el control
de permisos se comprobó con Styles y la configuración visible del portal.

En navegador: un solo canvas, atribución Powered by Esri visible, órbita y zoom operativos,
sin errores de consola. Apareció un aviso de precisión X4122 del compilador de shaders.
Se revisaron escalas orbitales y regionales diurnas; el acercamiento extremo sobre el desierto
arábigo se vio uniforme y **no constituye una nueva validación urbana de vehículos a nivel 19**.
La comprobación urbana anterior con servidor público permanece separada de esta activación.
TypeScript y build pasaron; Vite mantiene la advertencia de un chunk mayor de 500 kB.
No se modificó código de renderizado ni backend durante esta activación.

Fuentes: [credenciales y referrers](https://developers.arcgis.com/documentation/security-and-authentication/api-key-authentication/api-key-credentials/location-platform/)
y [control de Imagery de Styles](https://developers.arcgis.com/rest/basemap-styles/arcgis-imagery-webmap-get/).

## Medido

FPS con Edge sin ventana y CDP, a 1440×900 sobre la RTX 4060 (el monitor limita a 165), con los
builds de antes y después de esta fase:

| Escenario | Antes (2 pasadas) | Después (2 pasadas) |
| --- | --- | --- |
| Órbita girando | 165 / 165 | 165 / 165 |
| Himalaya alt 0,5, quieto | 164,8 / 158,0 | 156,0 / 162,4 |
| Himalaya alt 0,5, girando | 150,4 / 146,8 | 146,4 / 149,6 |
| Everest 380 km | 165 / 165 | 162,8 / 165 |
| Everest 51 km · Bogotá de noche | 165 / 165 | 165 / 165 |

La variación entre pasadas de una misma versión (hasta ±7 FPS) es mayor que la diferencia entre
versiones: con este método, la fase no tiene un coste medible en esta GPU. En órbita el tope de
165 Hz impide ver si el GPU trabaja más.

## Pendiente

- Probar en un móvil real y la rueda física cerca del suelo.
- Decidir si al acercar de noche se muestra la imagen Esri (oscurecida) en lugar de sólo luces.
- Sustituir las series sintéticas de `/api/trends/opposing` por datos reales (el par
  Ártico-Atlántico ya podría salir de GISTEMP).
