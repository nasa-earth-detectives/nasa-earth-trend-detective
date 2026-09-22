# NASA Black Marble: integración nocturna

Black Marble 2016 ya está activo en el material de la Tierra. La reserva de la
fase diurna anterior queda superada por el pase orbital del 22 de septiembre
de 2026. El [control histórico de etapa A](STAGE-A-REVIEW.md) conserva sus
observaciones; el estado y las mediciones actuales están en
[FINAL-ORBITAL-REVIEW.md](FINAL-ORBITAL-REVIEW.md).

## Fuente y assets

Se utiliza la capa oficial NASA GIBS **`VIIRS_Night_Lights`**, compuesto anual
Black Marble 2016, exclusivamente luces sobre transparencia. El fondo azul de
continentes y hielo de otras imágenes Black Marble no forma parte de la emisión.

| Archivo local desde `/earth/` | Resolución | Tamaño | Perfil |
| --- | --- | --- | --- |
| `night/black-marble-2016-4k.jpg` | 4096×2048 | 308.155 bytes | Escritorio |
| `night/black-marble-2016-2k.jpg` | 2048×1024 | 90.107 bytes | Móvil |

La imagen GIBS original de 8192×4096 se compone sobre negro antes de reducirla
con Lanczos. JPEG94 progresivo 4:4:4, sin tintado, incremento de brillo ni
selección artificial de ciudades. Interpretación: `SRGBColorSpace`.
No es radiancia calibrada ni una observación del año elegido en el timeline.

Fuentes, URLs, créditos y procedimiento completo:
[ORBITAL-SOURCES.md](ORBITAL-SOURCES.md). Dimensiones, bytes y SHA-256:
[orbital-manifest.json](orbital-manifest.json).

## Dirección solar y visibilidad

Una sola `sunDirection`, independiente de la cámara y definida en referencia
fija a la Tierra, controla la direccional, la máscara nocturna, la iluminación
de las nubes separadas y la atmósfera. La dirección inicial corresponde a
latitud 12° / longitud −65°.

El ciclo de presentación dura **20 minutos** y se pausa al desactivar
«Rotación automática» o al solicitar movimiento reducido. No simula
efemérides astronómicas ni se vincula a fechas del timeline. Mover la cámara
no mueve el terminador respecto de la geografía.

Las luces reciben intensidad 1,4 y una transición suave en el coseno entre
la normal superficial y la dirección solar: desde 0 en el límite diurno
hasta −0,12 al entrar en la noche. El lado diurno no recibe emisión de ciudades.
La superficie mantiene una contribución ambiental 0,12, con direccional 3,2,
AgX y exposición 1,1. Estos parámetros de presentación se centralizan en
`earthConfig.ts`; no son magnitudes físicas calibradas.

Las nubes se cargan por separado en 2K para escritorio y 1K para móvil,
con `NoColorSpace` como máscara gris. No hay nubes incorporadas al albedo,
iluminación nocturna blanca de día ni resplandor global de continentes.

## Reproducción y alcance

```sh
python scripts/build-earth-assets.py
python scripts/build-earth-orbital-assets.py
```

Los cinco mapas activos suman aproximadamente **29,33 MiB** en móvil,
**117,33 MiB** en Desktop Balanced y **245,33 MiB** con day 8K en Desktop High,
asumiendo RGBA8 con mipmaps. No incluye el resto de recursos de la GPU.

La integración reutiliza la misma escena, material de superficie, renderer y
canvas; las cargas actualizan mapas y capas existentes. La validación visual,
de funcionamiento y de rendimiento corresponde al [informe orbital final](FINAL-ORBITAL-REVIEW.md).
