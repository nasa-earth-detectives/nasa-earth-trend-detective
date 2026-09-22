# Candidatos oficiales para comparar la Tierra diurna

Preparados el 22 de septiembre de 2026. Son candidatos de evaluación A/B;
**no reemplazan julio ni se sirven como assets de producción**.

## Procedencia

Producto: **NASA Blue Marble: Next Generation, Base Map**, compuestos mensuales
de 2004. Organización y crédito: **NASA Earth Observatory**, Reto Stöckli;
datos Terra/MODIS. Las fuentes se enlazan desde el
[catálogo oficial Base Map](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/).
No se eligieron variantes con topografía sombreada, batimetría o nubes añadidas.

| Mes | Original oficial | Dimensiones | Bytes |
| --- | --- | --- | --- |
| Enero de 2004 | [world.200401.3x5400x2700.jpg](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/january/world.200401.3x5400x2700.jpg) | 5400×2700 | 1.884.678 |
| Septiembre de 2004 | [world.200409.3x5400x2700.jpg](https://assets.science.nasa.gov/content/dam/science/esd/eo/images/bmng/bmng-base/september/world.200409.3x5400x2700.jpg) | 5400×2700 | 1.709.729 |

SHA-256 de los originales, fijados en el script:

```text
world.200401.3x5400x2700.jpg
99f5faad74efe985fbf1714c8be7296ca9999759a1215b65f99b7f1df278dde5

world.200409.3x5400x2700.jpg
ed72e87674861f72e2a6e5df52f0cc6bf3df1edd9b862664cf18ac423e2e9e0e
```

## Derivados locales

Todos los originales, derivados y el manifiesto quedan únicamente en
`output/earth-candidates/`, fuera de `frontend/public` y del build web.

| Archivo derivado | Dimensiones | Formato | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| `blue-marble-january-4k.jpg` | 4096×2048 | JPEG RGB | 1.340.326 | `1e336fe1c200247922d20407b0420b447b46b8fd1a061337e9713625663d964d` |
| `blue-marble-september-4k.jpg` | 4096×2048 | JPEG RGB | 1.244.722 | `b22f30db5ddc8da3ca3907e763f838790c7db47a30585c4fdeccf8e1fea41440` |

Proceso: conversión RGB → reducción Lanczos → JPEG de calidad 92, muestreo
4:4:4, progresivo y optimizado. No se ajustan exposición, color, contraste,
saturación ni nitidez. Se conserva orientación equirectangular 2:1, norte
arriba, sin inversión ni desplazamiento longitudinal. Interpretación prevista
en la comparación: `SRGBColorSpace`.

No se aplica a estos candidatos el cierre polar específico de julio. La
comparación debe distinguir una diferencia de fuente de esa reparación
documentada en [DAY.md](DAY.md). Si algún candidato se elige, su empalme polar
necesita revisión propia antes de convertirse en asset de producción.

Cada textura 4K ocupa aproximadamente **42,7 MiB** como RGBA8 con mipmaps;
el JPEG comprimido no representa ese consumo GPU. No cargar los tres meses
simultáneamente en producción.

## Reproducción

Desde la raíz del repositorio, con Python y Pillow:

```sh
python scripts/compare-earth-sources.py
```

El script descarga sólo los originales que falten, comprueba sus SHA-256 y
dimensiones antes de procesarlos y genera ambos derivados. Una fuente que
cambie de hash detiene el proceso. Las salidas registradas se produjeron con
**Pillow 12.3.0**; otra versión de Pillow/libjpeg puede cambiar los bytes JPEG.
`output/earth-candidates/manifest.json` registra dimensiones, bytes, hashes,
versión y parámetros de procesamiento. No se modifica ningún archivo bajo
`frontend/public` ni la configuración del material.

## Uso y límites de la comparación

Comparar julio, septiembre y enero sobre la misma esfera, con iguales cámara,
distancia, luz, exposición, material y resolución. Los meses permiten evaluar
el contraste de bosque/desierto y nieve estacional. La elección debe hacerse
en capturas del globo, no sólo en el mapa plano. Este documento registra la
preparación; **no afirma un ganador ni que la prueba visual ya haya pasado**.

La comparación posterior ya está registrada en [STAGE-A-REVIEW.md](STAGE-A-REVIEW.md):
se conserva julio; ninguno de estos meses resuelve el relleno uniforme oceánico.

NASA advierte que el océano profundo de BMNG usa un relleno azul uniforme y
que pueden quedar residuos de nubes/nieve y transiciones costeras imperfectas.
Otro mes no aporta observaciones oceánicas ausentes de esa familia de mapas.
Estos compuestos tampoco son albedo PBR radiométrico certificado ni datos
vinculados al año seleccionado en el timeline.
[Limitaciones oficiales de BMNG](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/).

Uso sujeto a las [directrices de imágenes y medios de NASA](https://www.nasa.gov/nasa-brand-center/images-and-media/),
con crédito a NASA Earth Observatory y sin sugerir aprobación institucional.
La atribución de dominio público general de NASA no concede derechos sobre
logotipos ni material de terceros identificado como protegido.
