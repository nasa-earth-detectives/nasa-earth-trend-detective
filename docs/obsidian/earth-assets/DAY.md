# Color diurno

- Producto: Blue Marble: Next Generation, **Base Map**, julio de 2004.
- Autor y crédito: Reto Stöckli, **NASA Earth Observatory**; datos Terra/MODIS.
- [Página oficial](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/).
- [Original JPEG 5400×2700, 1.617.810 bytes](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x5400x2700.jpg).
- [Original JPEG 21600×10800, 21.125.326 bytes, fuente del 8K](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/july/world.200407.3x21600x10800.jpg).
- No se eligió la variante con nubes, relieve sombreado o batimetría añadida.
- `blue-marble-july-4k.jpg`: 4096×2048, calidad JPEG 92, 4:4:4 progresivo.
- `blue-marble-july-2k.jpg`: 2048×1024, calidad JPEG 90, 4:4:4 progresivo.
- `blue-marble-july-8k.jpg`: 8192×4096, calidad JPEG 92, 4:4:4 progresivo,
  4.453.772 bytes; carga opcional de escritorio al acercarse.
- Proceso: RGB → cierre del relleno polar descrito abajo → Lanczos → JPEG
  optimizado; sin ajuste global de color, contraste, saturación ni reenfoque.
- Para 8K, el decoder JPEG usa `draft` 1/2 a 10800×5400 antes de Lanczos:
  evita cargar los 233,28 MP del original. No se amplía el derivado 4K ni
  se añade reenfoque; dimensiones, hash de fuente y procesamiento se verifican.
- Interpretación de color en Three.js: `SRGBColorSpace`.
- Es una base visual de 2004, no un producto anual enlazado al timeline.
- Bytes y hashes de cada derivado: [manifest](asset-manifest.json).
- Condiciones y reproducción: [README general](README.md).

## Cierre mínimo del empalme polar

Ambos originales contienen una franja gris conectada a +180° entre el polo
norte y aproximadamente 83,6° N. Es un artefacto del empalme del relleno
oceánico de BMNG; no se interpreta como hielo observado. En 8K, antes de la
corrección, el último píxel a 88° N era RGB (119,122,129), frente al fondo
adyacente (2,5,20). La corrección cierra ese relleno; **no reconstruye
observaciones de hielo o agua** ni inventa variación oceánica.

Se modifica sólo la copia de trabajo, antes de Lanczos. Guardas duras:
longitud >=60° E y latitud >83,5° N, donde se verificó fondo uniforme sin
tierra ni hielo observado. Por fila se recorre la cola derecha conectada
que se desvía más de 6 unidades por canal respecto a (2,5,20), hasta
encontrar 8 píxeles consecutivos de fondo; se incluyen 4 píxeles de halo
JPEG y se asigna exactamente ese mismo relleno. Las demás filas no cambian.

| Copia de trabajo | Filas afectadas, inclusivas | Intervalo de fila 0 | Píxeles escritos / cambiados |
| --- | --- | --- | --- |
| 5400×2700, para 2K/4K | 0–95 | x=3676…5399 | 2698 / 2607 |
| 10800×5400, decoder 1/2 de 21600, para 8K | 0–191 | x=7208…10799 | 6623 / 6186 |

La fila 0 ocupa más columnas por convergencia en el polo; las filas siguientes
se estrechan rápidamente. Los intervalos exactos `[y,x0,x1)` de cada fila
están en `polar_fill_closure` del manifiesto, junto a hashes antes/después
de las dos regiones que cubren todo el exterior de la guarda. Esos hashes
son iguales: los continentes y las costas no se alteran antes de compresión.
Después de Lanczos y JPEG, todos los píxeles al sur de 83° N siguen siendo
idénticos a los derivados anteriores. El borde izquierdo conserva el original.
Los archivos fuente de NASA permanecen intactos, con sus SHA-256 verificados.
