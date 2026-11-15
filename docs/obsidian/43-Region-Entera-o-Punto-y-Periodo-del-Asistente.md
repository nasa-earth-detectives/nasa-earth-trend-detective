# 43 · Región entera o punto concreto, y el periodo del asistente

Registro del 2026-11-15 (segundo día del hackathon), rama `feat/region-or-point-analysis`.

El reto pide «acquire the data variables for a particular region». Hasta hoy las cinco «regiones» del
asistente eran **un solo punto cada una** con una ventana de ±1°: «Amazon» era el recuadro de 2° × 2°
alrededor de (−5, −60), no la Amazonía, y la interfaz no lo decía. Era el punto flojo del proyecto
frente al objetivo 2 del reto.

## Qué cambia

- **Se elige cuánto analizar.** En el paso «Location» del asistente, cada región ofrece dos opciones:
  **Whole region** (todo el recuadro de la región) o **One point** (la zona de 2° × 2° alrededor de un
  punto). «Pick on the globe» sigue siendo un punto.
- **La ficha dice qué se está mirando.** Donde salían sólo latitud y longitud ahora salen la región
  (por nombre), la zona analizada («Whole region · box 15°S–5°N, 75°W–50°W» o «One point · the 2° × 2°
  around it (about 220 km)») y una frase que explica cómo se calcula la serie. Un punto elegido a mano
  dentro del recuadro de una región lleva el nombre de esa región.
- **Se marca en el globo.** La región sale como un recuadro enmarcado y relleno; un punto, como su
  recuadro de 2° y un anillo que mantiene el tamaño en pantalla. Mientras el asistente está abierto,
  la marca sigue la respuesta que se está considerando.
- **El periodo del asistente ahora se usa.** La ficha calculaba siempre sobre todo el registro,
  eligieras lo que eligieras en el tercer paso. Ahora analiza los años elegidos, recortados a lo que
  cubre el dataset.

## Cómo se calcula una región

Recuadros en latitud y longitud, definidos en `frontend/src/config/wizardOptions.ts`. **Son
rectángulos que aproximan la región, no su contorno real**, y la interfaz lo dice:

| Región | Recuadro |
| :--- | :--- |
| Arctic | 66,5°N–90°N, toda la vuelta |
| Amazon | 15°S–5°N, 75°W–50°W |
| Sahara | 15°N–30°N, 15°W–35°E |
| Greenland | 60°N–83°N, 60°W–20°W |
| South Asia | 8°N–35°N, 68°E–92°E |

La API recibe el recuadro en `GET /api/trends` con dos parámetros nuevos y opcionales,
`latitudeRadius` y `longitudeRadius` (medio alto y medio ancho, en grados). La serie anual es la media
de todas las celdas del recuadro **ponderada por área** (coseno de la latitud): sin ponderar, las
celdas cercanas a los polos, que son más pequeñas, contarían lo mismo que las demás. Sin esos
parámetros la consulta es la de siempre, la media simple de la ventana de ±1°, y sus cifras no se
mueven.

Sobre esa serie corren las mismas pruebas que para un punto: pendiente de Sen, Mann-Kendall, prueba t,
intervalo de confianza y persistencia.

## Comprobado

- Backend: test nuevo `AnnualSeries_WholeRegion_IsWeightedByAreaAndThePointWindowIsNot` (una celda a
  10° y otra a 60° con valores distintos: la media de la región es la ponderada y la del punto no
  cambia). `dotnet build -warnaserror` sin avisos.
- En el navegador (Edge sin ventana, contra el backend local), con capturas:
  - Amazon, región entera, «Since 2000», temperatura del aire de MERRA-2: la petición lleva
    `latitudeRadius=10&longitudeRadius=12.5&startYear=2000`; la ficha dice «Region: Amazon · Whole
    region · box 15°S–5°N, 75°W–50°W»; serie 2000–2025, **+0,045 °C por año, p = 0,00021**.
  - Un clic en el globo: la petición no lleva recuadro; la ficha dice «Amazon · One point» con su
    latitud y longitud, y el globo muestra el anillo.
  - Sahara con «One point»: «Region: Sahara», 23°N 15°E, registro completo (1981–2025).
  - Sin errores en la consola.
- Frontend: `type-check` y `build` sin errores; React Doctor sin avisos.

## Qué NO se hizo

- **Los recuadros los elegí yo** mirando la extensión conocida de cada región; no salen de una fuente
  oficial de límites. Sirven para comparar una zona amplia con un punto, no como definición de la
  región.
- **No hay regiones dibujadas por el usuario** ni más regiones que esas cinco.
- **El mapa de tendencias por celda no cambia**: sigue siendo por celda, que es lo que responde al
  «dónde».
- **Los casos de tendencias opuestas siguen siendo puntos** (ventana de ±1°), no regiones.
- **Un recuadro que cruce el meridiano 180** no se une por los dos lados; ninguna de las cinco regiones
  lo cruza.
- **No está desplegado**: probado en local.

Relacionado: [[42-Auditoria-Datos-Reales-APIs-y-Rendimiento]] y
[[38-Como-Funciona-El-Detective-De-Tendencias]].
