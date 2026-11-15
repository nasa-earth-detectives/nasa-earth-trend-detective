# 44 · Buscador de lugares y proyección a años futuros

Registro del 2026-11-15 (segundo día del hackathon), rama `feat/neiva-point-and-projection`.

Sale de dos recomendaciones que el equipo recibió después del pitch: **analizar un punto concreto**
(por ejemplo Neiva, Huila, donde se hizo el proyecto) y **dar una predicción para años futuros** (por
ejemplo 2027). Diego lo concretó así: un buscador de ciudades y países; al escribir «neiva» sale
«Neiva (Huila)», y al pulsarlo se abre un modal con las predicciones de los próximos años.

## Qué hay ahora

- **Buscador en la cabecera.** Se escribe una ciudad, un departamento o un país y aparece una lista.
  Al elegir uno, el globo gira hacia él, marca lo que se va a analizar y se abre su proyección.
- **Modal de proyección.** Nombre del lugar, qué zona se analiza, un botón por cada una de las nueve
  variables, la serie anual con su recta de tendencia, el veredicto de significancia y los valores
  proyectados para 2027, 2030, 2035 y 2040 con su rango. Un botón lleva al análisis completo (la ficha
  de siempre), que ahora muestra el nombre del lugar.
- **La proyección también en la ficha** y en la gráfica: la recta sigue en discontinuo hasta el último
  año proyectado, dentro de una banda con su rango.
- **Neiva, Huila** es además una opción con nombre en el paso «Location» del asistente.

## Qué zona se analiza

- **Una ciudad** se analiza como un punto: los 2° × 2° de alrededor (unos 220 km de lado), igual que
  un punto elegido en el globo. Los datos están cargados en celdas de 2°, así que la serie de «Neiva»
  es la de la celda que la contiene, cordilleras incluidas, **no la de la ciudad**. El modal lo dice.
- **Un departamento o un país** se analiza como el recuadro de su extensión, con la media ponderada
  por área de la nota 43. **Es un rectángulo, no la frontera**: puede incluir mar y países vecinos, y
  el modal lo dice.
- Un país cuya extensión es más ancha que un océano (territorios de ultramar, o cruza el meridiano
  180) se analiza como un punto en su centro.

## Cómo se calcula la proyección

Con la serie anual que devuelve `GET /api/trends` y su pendiente de Sen, en el navegador
(`frontend/src/utils/trendProjection.ts`):

1. **Recta de Theil-Sen:** la pendiente es la de la API; el intercepto, la mediana de lo que queda de
   cada valor al quitarle la pendiente.
2. **Valor proyectado** de un año: el de esa recta.
3. **Rango al 95 %:** el intervalo de predicción de un ajuste lineal: la dispersión de los años
   alrededor de la recta más la incertidumbre de la propia recta, que crece con la distancia.
4. **Hasta dónde:** no más lejos que la mitad de la longitud del registro. Con 45 años se llega a
   2040; con 26, a 2035; con 11, a 2030. Con menos de 10 años no se proyecta.

**No es un modelo climático.** Es la tendencia del pasado llevada hacia adelante: no sabe nada de
emisiones, de El Niño ni de nada que no haya ocurrido ya en el registro. La interfaz lo dice, y cuando
la tendencia no es significativa avisa de que la proyección dice poco.

Los valores son los mismos que dibuja la gráfica: **anomalías** respecto al periodo base de cada
variable cuando la API las da (por ejemplo, temperatura del aire respecto a 1991–2020).

## De dónde salen los lugares

Tres servicios abiertos, sin clave. Lo que se escribe en el buscador se envía a los dos primeros.

| Servicio | Para qué | Cuándo |
| :--- | :--- | :--- |
| Open-Meteo (datos de GeoNames) | Ciudades y países | Mientras se escribe |
| Photon (komoot, datos de OpenStreetMap) | También departamentos y estados, con su extensión | Mientras se escribe, con 2,5 s de paciencia; si no contesta se le deja 5 minutos en paz |
| Nominatim (OpenStreetMap) | La extensión de un país | Una vez, al elegir un país. Su política de uso prohíbe consultarlo mientras se escribe |

Además hay una lista interna (Neiva, Huila y Colombia) que responde sin red. El recuadro de Colombia
es el de su territorio continental (4,2°S–12,5°N, 79°W–66,9°W), escrito a mano.

Durante las pruebas **Photon dejó de responder** (20 s sin contestar a ninguna consulta). Por eso no
es el único proveedor.

## Comprobado

- **Cifras:** las siete que muestra la web para Neiva coinciden con un cálculo independiente en Python
  con el cuantil exacto de la t de Student (SciPy):
  - Temperatura del aire de MERRA-2, 1981–2025: +0,021 °C por año, p = 0,0025. Anomalía proyectada
    respecto a 1991–2020: 2027 → 0,43 °C (−0,61 a 1,47); 2030 → 0,49 (−0,55 a 1,54); 2035 → 0,60
    (−0,47 a 1,66); 2040 → 0,70 (−0,39 a 1,79).
  - GISTEMP, 2000–2025: +0,0475 °C por año. Anomalía respecto a 1951–1980: 2027 → 1,64 °C (1,03 a
    2,24); 2030 → 1,78 (1,15 a 2,40); 2035 → 2,02 (1,36 a 2,67).
- **En el navegador** (Edge sin ventana contra el backend local), 21 comprobaciones: buscar «neiva»,
  «huila», «colombia» y «kenya»; el modal de un punto y el de un país; cambiar de variable; una
  variable sin serie; pasar al análisis completo; una petición que falla y su reintento; el buscador
  con Photon caído y con los tres servicios caídos. Sin errores de consola. También en español y a
  390 px de ancho.
- `type-check` y `build` sin errores; React Doctor sin avisos; ningún archivo supera 250 líneas.

## Dos arreglos de paso

- **El bioma de Neiva.** La ficha decía «Amazon Tropical Rainforest» para Neiva: el recuadro de la
  Amazonía de esa nota incluía los Andes y la costa del Pacífico (también Bogotá, Quito y Lima). Se
  estrechó a la cuenca al este de los Andes.
- **«No hay datos» frente a «no se pudo cargar».** La API limita los análisis a 60 por minuto y por
  IP. Si una petición falla, el modal lo dice y deja reintentar, en vez de afirmar que no hay serie.

## Qué NO se hizo

- **No hay fronteras reales**: los países y departamentos son rectángulos.
- **La serie de una ciudad no es la de la ciudad**, sino la de su celda de 2°.
- **Open-Meteo no devuelve departamentos ni estados**: sólo aparecen cuando Photon contesta, o si
  están en la lista interna (Huila).
- **Los tres servicios de lugares son públicos y sin garantía.** Si fallan todos, queda la lista
  interna y elegir el lugar en el globo.
- **La proyección es una recta.** No capta aceleraciones ni cambios de régimen.
- No se pasó ESLint en local (no está instalado en este equipo). No está desplegado: probado en local.

Relacionado: [[43-Region-Entera-o-Punto-y-Periodo-del-Asistente]] y
[[38-Como-Funciona-El-Detective-De-Tendencias]].
