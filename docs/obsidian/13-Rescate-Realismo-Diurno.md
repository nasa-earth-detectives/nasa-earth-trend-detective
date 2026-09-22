# Rescate del material diurno

Volver a [[12-Superficie-Terrestre-NASA]] · [[00-Map-Of-Content]]

## Diagnóstico previo a los cambios

Se conservaron 15 capturas BEFORE en `output/playwright/rescue-before-*.png`
y los POV/cámaras/luces exactos en `rescue-before.json`.

- No había un error de sRGB ni una luz apuntando al hemisferio equivocado.
  El quaternion de cámara se aplicaba correctamente y el target era el origen.
- Phong usaba ambiente 1,7 y direccional 2,1. El ambiente equivalía a un piso
  difuso de aproximadamente 0,54; cerca del foco la suma podía superar 1.
  Esto aplanaba las normales y recortaba el hielo con `NoToneMapping`.
- La exposición era 1. Bajo `NoToneMapping`, variar exposure no corrige el
  problema: esa curva no aplica exposición a la salida.
- El 55,68 % del JPEG 4K era exactamente RGB (2,5,20). NASA documenta que
  BMNG rellena el océano profundo con un azul uniforme. El Pacífico oscuro
  no era un fallo del loader ni podía solucionarse con más resolución.
- El interior de Groenlandia ya promediaba (252,254,253) en la fuente; ningún
  shader puede reconstruir variación que no está presente en esa imagen.
- El mapa elegido era BMNG Base Map, sin capa añadida de nubes, topografía
  sombreada o batimetría. Es un compuesto de color de superficie, no una
  medición BRDF/PBR certificada. NASA reconoce residuos de nubes/nieve.
- La máscara de agua ya separaba reflejo de tierra, pero Phong sólo cambiaba
  intensidad especular; la forma del brillo seguía usando shininess global.
- La línea polar tenue también existía antes: al aislar mapas desaparece al
  retirar el albedo, no al retirar bump o máscara. Los píxeles del extremo
  +180° cerca de 84–89° N son grises, mientras -180° contiene relleno azul.
  Es una discontinuidad de la imagen fuente, no un problema de normales.

El generador cierra esa cola conectada al borde con el mismo relleno BMNG,
antes de Lanczos. Está acotado al norte de 83,5° N y al este de 60° E;
los intervalos exactos y hashes de las regiones intactas están en el manifiesto.
Los originales NASA permanecen sin modificar. Es reparación del empalme de
un relleno gráfico, no reconstrucción de observaciones de agua o hielo.
Todos los píxeles decodificados al sur de 83° N permanecen idénticos en
2K, 4K y 8K frente a los derivados anteriores.

## Material

`earthMaterial.ts` conserva el GGX y la iluminación de `MeshStandardMaterial`.
Dos puntos de extensión específicos de Three r186 convierten la máscara de
agua en rugosidad y reflectancia normal F0: tierra 0,04; agua calculada desde
IOR 1,333 (aproximadamente 0,0204). El shader calcula el color especular antes
de `specularColorBlended`, utilizado realmente por el BRDF de esta versión.
La rugosidad es 0,92 para terreno y 0,54 para agua: un parámetro global de
apariencia, no un producto de viento u oleaje medido.

Se reutiliza la muestra de `roughnessMap`. No hay pase adicional, shader solar,
displacement, metalness, clearcoat, bloom, emissive, nubes ni luces nocturnas.
Sin máscara se aplica respuesta rugosa de terreno; no aparece agua brillante
en toda la esfera. GEBCO sólo perturba la normal con bumpScale 0,065.

El relleno oceánico sin información de BMNG se detecta con distancia en RGB
lineal al valor fuente (2,5,20) y una transición smoothstep (0,002–0,12).
Sólo dentro de la máscara de agua se añade la diferencia entre ese relleno
y una reflectancia difusa lineal aproximada (0,003; 0,017; 0,042).
La corrección aditiva conserva las diferencias de la fuente en costas,
evitando el contorno oscuro que producía una sustitución de rango estrecho.
También puede ajustar el nivel de aguas costeras oscuras; no constituye una
calibración de colorimetría oceánica. Sigue recibiendo iluminación y sombra del
material; no es emisión ni un gradiente pintado. Es una aproximación visual
del cuerpo de agua, no un nuevo dato NASA ni una medición regional.
Fuera de la máscara de agua no se altera el albedo de tierra ni hielo.

Se investigó NOAA VIIRS Science Quality nLw de julio 2020, tres bandas y F0
oficial NASA OCSSW. Escala/offset/unidades y hashes quedaron registrados en
`output/earth-source/rescue-ocean/`. La candidata literal π·nLw/F0 resultó
más oscura, con huecos de cobertura y una conversión espectral aproximada.
No se integró ni se aumentó su intensidad fingiendo una medición validada.
Tampoco se utilizó Blue Marble 2002: su océano usa clorofila coloreada, y la
variante con relieve sombreado produciría doble iluminación terrestre.

Limitación conservada: no existe variación observada del océano profundo en
el albedo de producción. La variación costera viene de BMNG; la respuesta del
agua de fondo es un modelo homogéneo, modulado por luz y ángulo de observación.

## Iluminación y rango

Una direccional blanca dominante, relativa a cámara, mantiene una vista diurna
al inspeccionar cualquier continente. Es una luz de observación, no la posición
astronómica del Sol. El ambiente baja a 0,24 frente a 3,2 de la direccional.
Su dirección local es (-1, 0,65, 1,8). No se añaden luces compensatorias.

Comparaciones guardadas: `rescue-diagnostic-phong-*.png` y `rescue-pbr-*.png`.

| Curva probada | Observación durante la calibración |
| --- | --- |
| NoToneMapping, anterior y PBR | Altas luces sin margen; valores altos se recortan. |
| ACESFilmicToneMapping | Conserva altas luces, pero endurece sombras y oscurece el agua. |
| NeutralToneMapping | Conserva más saturación; verdes y contraste resultaron demasiado fuertes. |
| AgXToneMapping | Transición de altas luces más gradual y mejor equilibrio entre hielo, desierto y bosque. |

Se eligió AgX con exposición 1,1. Las estrellas usan `toneMapped:false` para
mantener su aspecto previo, sin modificar su geometría, movimiento o lifecycle.
La atmósfera y la retícula no se usan para disimular problemas de superficie.

## Contratos y cobertura de QA

- Seis regiones: África/Europa, Norteamérica, Sudamérica, Asia/Pacífico,
  Australia y Ártico/Groenlandia; cada una a órbita normal y zoom más cercano.
- Comparación 2K/4K con misma cámara, luz y material; móvil 390×844.
- Comparación 8K desde original NASA 21600×10800: mejora visible de costa y
  terreno al zoom cercano; no se amplía artificialmente el mapa 4K.
- Carga retardada: mismo nodo canvas, renderer y material antes/después.
- Agua ausente, mapas auxiliares ausentes y fallo total: fallback sin reintentos.
- Desmontaje antes de terminar las cargas: respuestas tardías descartadas.
- Variables, tiempo, escena, resize, arrastre y rotación: sin recargar mapas.
- Zoom cercano de escritorio: mejora opcional a 8K, una sola solicitud,
  conserva el 4K durante la carga o si falla, y libera el 4K al reemplazarlo.
- Inspección del GLSL compilado, errores de consola y contador de texturas.

Three r186 añade una LUT DFG interna al material físico: el contador de cuatro
texturas corresponde a tres mapas propios más esa LUT, no a un cuarto mapa Earth.
Las capturas y pruebas funcionales no equivalen a medir FPS sostenidos ni GPU móvil.

La suite `rescue-lifecycle.cjs` pasó 133 comprobaciones en 11 escenarios:
misma instancia/canvas/material, GLSL compilado, estados de carga y fallo,
desmontaje tardío y política 8K. Además, la rueda real del navegador activó
el reemplazo 4K→8K conservando el canvas y material. La muestra central de
Groenlandia (33.600 píxeles) pasó de 51,01 % con un canal a 255 a 0 %;
esto no implica que cada píxel de hielo mundial haya sido medido.
La consola real conserva HTTP 500 de la API local; no se alteró backend.
Se revisaron 29 capturas finales: 23 de regiones/resoluciones y seis tras la
reparación polar. La línea desapareció y las vistas a ±179,5° no muestran
una banda nueva. Se conserva la limitación visual del océano uniforme y del
zoom máximo en móvil 2K; la aceptación de realismo sigue pendiente de Diego.

## Resolución y coste

Escritorio inicia en 4K; sólo tras interacción a altitud <= 1,2 solicita 8K
si maxTextureSize >= 8192 y deviceMemory >= 8 GiB, cuando esa API existe.
El perfil móvil/táctil sigue en 2K. La decisión no cambia con el resize.
No hay motor de LOD, temporizador de calidad ni estado React por frame.

El 8K final pesa 4.453.772 bytes y parte del JPEG NASA de 21.125.326 bytes. Su
generador valida SHA-256 y usa draft JPEG 1/2 antes de reducir con Lanczos.
El conjunto de mapas pasa de aproximadamente 64 a 192 MiB en GPU
(RGBA8+mipmaps; no memoria total). Durante una sustitución podría coexistir
hasta 234,7 MiB de mapas; se dispone el anterior al instalar el nuevo.
La calidad cercana de móvil queda limitada por 2K; no se promete el mismo
detalle que escritorio ni rendimiento en hardware móvil que no se ha medido.

## Aprobación

Esta pasada no autoriza avanzar a noche, terminador, Black Marble ni nubes.
La aceptación visual corresponde a Diego sobre el resultado local.
