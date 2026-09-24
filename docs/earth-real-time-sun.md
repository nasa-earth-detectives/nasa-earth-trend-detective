# Iluminación solar en tiempo real

## Posición solar

`getSubsolarPoint(timestampMs)` recibe milisegundos Unix UTC y devuelve `{ lat, lng }` en grados, positivos al norte y al este. La longitud pertenece a `[-180, 180)`. Es una función pura, sin red, reloj propio ni dependencias de cámara o del año de los datos climáticos. Rechaza valores no finitos y fechas fuera del intervalo admitido por JavaScript.

Se calculan la anomalía media, longitud eclíptica, oblicuidad, ascensión recta y declinación con el [algoritmo solar del US Naval Observatory](https://aa.usno.navy.mil/faq/sun_approx). La declinación proporciona la latitud subsolar. La longitud resulta de restar el [tiempo sidéreo medio de Greenwich](https://aa.usno.navy.mil/faq/GAST), expresado en grados, a la ascensión recta. Así se contemplan tanto la estación como la variación del tiempo solar a lo largo del año.

El cálculo aproxima UT1 mediante UTC y omite la pequeña corrección entre tiempo sidéreo medio y aparente. El USNO describe una precisión solar aproximada de un minuto de arco entre 1800 y 2200; este conjunto de aproximaciones se usa para iluminación visual, sin prometer exactitud para navegación. No modela refracción atmosférica, relieve, eclipses o nubosidad real. La hora depende del reloj del dispositivo.

## Integración en la escena

`earthLighting.ts` consulta `Date.now()` al montar y cada 1.000 ms. Convierte el punto subsolar con `globe.getCoords` y modifica la misma `Vector3` compartida por la luz direccional, Black Marble, nubes y atmósfera. No sustituye material, canvas, renderer ni instancia Globe. No añade trabajo al callback de cada frame ni estado React por frame.

Las pestañas ocultas omiten el cálculo; `visibilitychange`, `pageshow` y `focus` recuperan inmediatamente la hora absoluta. No se acumulan incrementos de tiempo: un reloj corregido o un equipo que despierta no conserva una fase solar antigua. El desmontaje cancela el intervalo y los tres listeners, también bajo Strict Mode.

El timeline selecciona observaciones climáticas. La rotación automática mueve la cámara. Ninguno controla el Sol; `prefers-reduced-motion` tampoco congela la fecha astronómica. El panel de escena indica «Terminador día/noche · Hora actual» dentro del sistema visual integrado.

La sincronización corresponde a **iluminación**, no a imágenes satelitales en directo: Blue Marble, Black Marble 2016 y las nubes siguen siendo los assets documentados del proyecto. Los hexágonos/mapa de calor son capas analíticas y conservan su legibilidad independientemente del Sol.

## Pruebas

Ejecutar `node scripts/validate-solar-position.cjs`. Las referencias de declinación y ángulo horario proceden del [servicio de navegación celeste USNO](https://aa.usno.navy.mil/data/api#celnav); las fechas de equinoccios y solsticios, del [servicio de estaciones de 2026](https://aa.usno.navy.mil/api/seasons?year=2026). El script conserva valores externos y funciona sin conexión, con tolerancia de 0,03°.

También comprueba Colombia a las 21:06 (noche) y a las 12:00 (día), equivalencia entre zonas horarias, avance hacia el oeste, continuidad al cruzar medianoche y el antimeridiano, años bisiestos y entradas inválidas. El 22 de septiembre de 2026 a las 21:06 en Colombia corresponde a `2026-09-23T02:06:00Z`.

`node scripts/validate-earth-lighting.cjs` comprueba la integración con Three: actualización inicial y cada segundo, identidad del vector compartido, saltos del reloj hacia adelante/atrás, suspensión y reanudación, preservación del callback del renderer y limpieza idempotente de intervalos/listeners.

### Validación local del 22 de septiembre de 2026 (Colombia)

- Ambos scripts y `npm run type-check --workspace=frontend`: aprobados.
- `npm run build --workspace=frontend`: aprobado. Continúa la advertencia previa de chunk JS >500 kB; sin dependencias nuevas.
- Navegador, misma cámara: Bogotá a las 21:06 tiene elevación solar aproximada −49,08°; a las 12:00, +84,26°. Capturas locales `output/playwright/realtime-colombia-2106.png` y `realtime-colombia-1200.png`.
- Girar a Asia y cambiar el timeline de 2024 a 2002 no altera la dirección solar para la misma hora de prueba. Desactivar la rotación o activar movimiento reducido tampoco bloquea las actualizaciones.
- Luz, nubes y atmósfera conservan dirección coincidente; las dos últimas comparten el mismo objeto. Se conserva un canvas con la misma identidad antes/después de todos los cambios.
- Vista móvil 390×844 revisada. Texturas y datos climáticos permanecen independientes del reloj solar.
- Las horas de prueba sólo se inyectaron en respuestas del navegador de validación; no hay selector de hora ficticia en producción. Se retiraron las interceptaciones y se recargó con la hora real.
- Consola final: cero errores y cero advertencias.
- Medición en una sesión nueva con reloj real y sin Playwright Clock, Edge/RTX 4060, 1440×900, DPR 1, 1.662 hexágonos y seis llamadas de dibujo: reposo 165,05 FPS promedio; órbita 164,97. Peor ventana de un segundo 164,85 FPS; frame más lento 12,1 ms. Seis segundos por escenario; no es una garantía para otro hardware. [Mediciones completas](validation/realtime-solar-performance.json).
