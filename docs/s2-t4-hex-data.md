> **Referencia histórica:** este documento describe el demo de pendientes anterior, no el montaje actual. La fuente y unidades vigentes están en [S2-T4 — capas de observaciones](s2-t4-observation-layers.md).

# S2-T4.1 — frontera de datos de columnas geográficas

La capa usa `HexDataset`, no objetos de Three.js ni el DTO de transporte directamente. Cada `HexCell` contiene `id`, `latitude`, `longitude` y `slope`. La altura representa `abs(slope)` frente a `heightDomain`; el signo no se pierde. La altura no representa relieve del terreno.

## Modo demostrativo actual

`VITE_HEX_DATA_SOURCE=demo` y `VITE_HEX_DEMO_PROFILE=global` son los valores predeterminados. No necesitan backend ni acceso a fuentes remotas en ejecución. `frontend/src/services/demo/hexDemoData.ts` distribuye **8.192 centros ficticios** sobre toda la esfera. Temperatura y CO₂ conservan todos; vegetación usa **1.458** huellas continentales sin hielo cartografiado y agua/hielo **1.662** huellas continentales. El [escenario global](s2-global-demo.md) documenta el filtro costero e hielo generado offline con NASA MODIS y Natural Earth. No son observaciones, cobertura de un satélite, interpolaciones ni resultados científicos.

Los centros globales siguen una distribución Fibonacci aproximadamente uniforme en área; la separación de 2,2° es nominal, no resolución científica. El campo sintético es continuo sobre la esfera, incluido el antimeridiano. El mismo perfil y filtro producen las mismas celdas, y no se calcula geografía por frame. La huella visual deja separación para leer el planeta. Los filtros conservadores no garantizan representación de cada país pequeño, isla o franja costera.

`VITE_HEX_DEMO_PROFILE=regional` conserva la comparación anterior: ocho grupos de 91 centros, con 728 muestras para temperatura/CO₂, 455 para vegetación y 467 para agua/hielo. Su [guarda regional](s2-demo-coverage.md) se documenta por separado. `VITE_HEX_DEMO_PROFILE=stress` conserva 6.211 celdas frontales para todas las variables, exclusivamente para ensayar carga. Ninguno de estos dos perfiles es el predeterminado.

Las posiciones e identificadores de cada ubicación permanecen estables. El subconjunto visible depende de la variable; entre fechas de una misma variable sólo cambia la pendiente ficticia. Las escalas de altura están fijadas por variable, no por el máximo de cada respuesta; navegar el tiempo no renormaliza engañosamente la altura:

| Variable | Unidad demostrativa | Dominio vertical absoluto |
| --- | --- | --- |
| Gistemp | °C / año | 0,08 |
| ModisNdvi | NDVI / año | 0,015 |
| GraceMass | cm H₂O eq. / año | 3 |
| Oco2 | ppm / año | 4 |

Estos dominios son decisiones de presentación de una demostración. **No constituyen umbrales científicos**, y los signos no pretenden describir el comportamiento real de una región o variable.

## Conectar la API del equipo

1. Configurar `VITE_HEX_DATA_SOURCE=api` y `VITE_API_URL` en el entorno local; reiniciar Vite o reconstruir el frontend.
2. El adaptador llama al servicio existente `trendService.getTrends(filter)`, que consulta `/trends` con `variable`, `startYear` y `endYear`.
3. La respuesta debe ser una lista con `latitude`, `longitude` y `sensSlope` numéricos y finitos, o un objeto con esa lista en `cells`. Los campos de contexto existentes `variable`, `startYear` y `endYear`, si están presentes, deben coincidir con la petición. El enum actual del backend se serializa como número: `1=Gistemp`, `2=ModisNdvi`, `3=GraceMass`, `4=Oco2`; el adaptador admite esos valores y sus nombres equivalentes. No hace falta `confidenceInterval95` para dibujar estas columnas.
4. Confirmar con el equipo científico la **unidad y base temporal de la pendiente**, el dominio visual apropiado por variable y la resolución espacial real. El backend actual no devuelve unidad ni resolución, y su ejemplo comenta una tasa por década mientras otros tipos del frontend describen tasas anuales. El adaptador muestra «pendiente · unidad no declarada» en ausencia de `unit`; no convierte ni afirma una tasa anual.
5. Preferir un objeto con `cells`, `unit`, `resolutionDegrees` y `heightDomain` para declarar una sola vez los metadatos de la respuesta. También se admiten `unit` y `resolutionDegrees` en cada registro de la lista antigua; si se declaran allí, deben estar presentes en todos los registros y ser coherentes. Un objeto exterior puede aportar los campos que falten en cada celda. Hasta disponer de resolución real, 2,2° es únicamente una huella de presentación. La malla visual no implica cobertura científica del sensor.

`HEX_API_PRESENTATION`, en `hexDataSource.ts`, configura por separado los dominios provisionales API: **1 unidad de pendiente desconocida**, con separación visual de 2,2°. No reutiliza la escala anual del demo ni convierte el `0.28` del servidor. El backend puede suministrar `heightDomain` positivo en el objeto exterior, siempre fijo por variable/unidad entre periodos. Antes de activar datos científicos se debe acordar esa escala con el equipo y actualizar la configuración o el contrato. Esto impide presentar por error tasas por década con una escala por año.

El ejemplo de API que actualmente existe sigue siendo demostrativo. Seleccionar `api` identifica el transporte, **no certifica que la información proceda de NASA**. Solo el equipo de datos puede confirmar ese origen. La capa visual puede mantenerse mientras se sustituye el servidor de ejemplo por el procesamiento real.

Ejemplo de contrato compatible (valores deliberadamente ficticios):

```json
{
  "variable": "Gistemp",
  "startYear": 2002,
  "endYear": 2024,
  "unit": "°C / año",
  "heightDomain": 0.08,
  "resolutionDegrees": 2.2,
  "cells": [
    { "latitude": 4.711, "longitude": -74.0721, "sensSlope": 0.025 }
  ]
}
```

Las coordenadas inválidas, pendientes no finitas, unidades incompatibles y ubicaciones duplicadas provocan un error explícito. Una respuesta vacía se conserva vacía. Un fallo de API **no cambia silenciosamente a datos inventados**.

## Ciclo de consulta

`useHexData(filter, enabled)` expone `data: HexDataset | null`, `loading: boolean` y `error: string | null`. Con la capa apagada no consulta. Cambiar variable o periodo cancela la entrega anterior, limpia el dataset visible y solo admite la respuesta vigente. Al desmontar también se cancela la entrega mediante `AbortController`.

El servicio HTTP previo no admite `AbortSignal`, por lo que una solicitud de red ya iniciada puede terminar en segundo plano. El adaptador cancela su espera y el hook ignora cualquier resultado tardío; no actualiza una escena desmontada ni mezcla filtros. Cuando el servicio compartido incorpore `signal`, basta con reenviarlo para cancelar también el transporte sin cambiar el contrato de la capa.

## Verificación del contrato

Desde la raíz del repositorio, con las dependencias habituales instaladas:

```bash
node scripts/validate-hex-data.cjs
npm run type-check --workspace=frontend
```

El script usa TypeScript ya instalado y las bibliotecas estándar de Node; no añade dependencias ni necesita un servidor. Comprueba el perfil global de 8.192 centros y sus subconjuntos, la comparación regional de hasta 728 y las 6.211 celdas de estrés. Verifica geografía, determinismo, signos, dominios fijos, compatibilidad del enum numérico y del objeto de metadatos API, rechazo de datos inválidos, cancelación de respuestas y ausencia de fallback silencioso al demo. Intercepta el servicio de red en un entorno aislado para probar el adaptador real sin modificar código de producción. No sustituye la validación visual ni mide FPS. Las fuentes geográficas globales se comprueban además con `python scripts/build-global-hex-demo.py --check`.

## Representación e interacción — S2-T4.1

`hexColumns.ts` monta una `InstancedMesh` de prismas hexagonales en la capa personalizada pública de Globe.gl. Así las columnas comparten la transformación inicial del planeta. Se conserva el renderer, el canvas, el material de la Tierra, las nubes, estrellas y controles orbitales.

- Altura lineal: `min(1, abs(slope) / heightDomain) × radio × 0.048`. Valores fuera del dominio quedan limitados a la altura máxima, pero la lectura muestra su valor original. El cero tiene una base visual mínima de 0,001 unidades de escena.
- Base sobre la superficie, sin desplazamiento del terreno; radio de columna `radio × π/180 × resolutionDegrees × 0.34`. Quedan espacios para reconocer la geografía.
- Una geometría y un material compartidos. Caras laterales más oscuras y tapa legible; el color es una anotación analítica visible de día y de noche, no un material físico del planeta. S2-T4.2 añade la paleta divergente descrita en [paleta y rendimiento](s2-t4-palette-performance.md).
- Transición de altura de 440 ms en el bucle existente, sin RAF paralelo ni estado React por frame. Respeta movimiento reducido. La escala permanece fija durante la navegación temporal. Mientras se consulta un nuevo filtro se retiran los datos anteriores; las alturas se conservan internamente para interpolar cuando llega el siguiente conjunto.
- Pulsación sobre una columna: coordenadas y pendiente exactas del dataset. Un arrastre o gesto multitáctil no selecciona. Las columnas del hemisferio oculto no se pueden pulsar a través de la Tierra.
- Una consulta oculta el valor anterior mientras carga y conserva la ubicación seleccionada por ID. El nuevo periodo muestra su pendiente actual; si la ubicación queda fuera de la cobertura de la nueva variable, la selección se limpia. Apagar la capa o deseleccionar sí elimina esa intención.
- La lectura indica «Tendencia de temperatura» (o la variable correspondiente), periodo y unidad temporal legible. Presenta tres cifras significativas sin transformar la magnitud; el valor recibido exacto permanece disponible en el título del número. Una pendiente no es temperatura actual ni anomalía instantánea. El texto accesible explica la dirección completa, preservando unidades API desconocidas sin suponer una tasa anual.
- Selector nativo accesible por teclado; interruptor en Datos para volver a la Tierra sin capa. El aviso de simulación permanece en móvil y con el panel abierto.
- Navegar a un año anterior al inicio del periodo ajusta su inicio para no enviar `startYear > endYear`. Un periodo de un solo año en el demo sigue siendo ficticio y no implica que pueda estimarse una tendencia científica.

## Validación histórica S2-T4.1 — 22 de septiembre de 2026

Esta sección conserva la revisión inicial con **728 columnas regionales**, anterior al perfil global. No describe el coste de la distribución global predeterminada. Su validación vigente se registra en [s2-global-demo.md](s2-global-demo.md); las cifras siguientes se mantienen como referencia comparativa.

En esa revisión pasaron TypeScript, build de producción y script de contrato. El build mantenía el aviso previo de bundle grande; no se añadieron dependencias. No se ejecutó lint porque ESLint no estaba instalado en el proyecto.

Navegador Edge, GPU NVIDIA GeForce RTX 4060, viewport 1920×1080, DPR 1, 728 columnas, Tierra con nubes y atmósfera. Muestras de cinco segundos por interacción, contando frames nuevos del renderer desde `requestAnimationFrame`:

| Caso | FPS medio | Peor ventana de aproximadamente 1 s | Frame más largo |
| --- | ---: | ---: | ---: |
| Rotación en reposo | 165,05 | 164,98 | 6,2 ms |
| Arrastre orbital | 164,73 | 163,66 | 18,2 ms |
| Zoom | 165,08 | 164,98 | 6,3 ms |

Es una medición corta en este equipo, no una garantía universal de 60 FPS. El pico de 18,2 ms equivale a aproximadamente 55 FPS instantáneos. Se registraron seis llamadas de dibujo y 38.352 triángulos en la escena completa; las columnas añaden una llamada. Esta medición corresponde a S2-T4.1; la validación posterior con **6.211 celdas visibles** de S2-T4.3 está en [paleta y rendimiento](s2-t4-palette-performance.md).

Comprobados 1920×1080, 1440×900, 1024×768 y 390×844: selección por canvas y por selector, cambio de variable, año, visibilidad, cierre con Escape, fuente visible, movimiento reducido y año mínimo 2000. El mismo nodo canvas y la misma malla permanecen después de alternar filtros/visibilidad y redimensionar. Seis geometrías y seis texturas antes/después de tres ciclos de apagado/encendido; esto comprueba estabilidad básica, no una prueba prolongada de fugas. Error máximo medido entre altura esperada y matriz: `3.14e-7` unidades.

Móvil se validó como viewport en el mismo ordenador, no en GPU de teléfono. Sin errores nuevos de ejecución o shader. Persisten las respuestas 500 de las consultas previas `/api/health` y `/api/trends/observations` cuando el backend local está apagado; la capa demo funciona independientemente.

Capturas y guiones de inspección locales, excluidos de Git: `output/playwright/hex-*`. Sin cambios en backend. Trabajo local, sin commit ni publicación.
