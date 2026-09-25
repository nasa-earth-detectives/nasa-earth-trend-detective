# S2-T4 — capas anuales de observación terrestre

Entrega de Diego Arias: prismas hexagonales, mapa de calor alternativo, selección regional y paletas por variable. Los valores siguen siendo **simulados** y están identificados en pantalla; no representan observaciones NASA ni estadísticas calculadas.

## Documentos vigentes

- [Contrato, arquitectura y límites de las capas](../s2-t4-observation-layers.md).
- [Validación funcional y mediciones iniciales](../validation/s2-observation-validation.md).
- [Revisión de entrega y contraste térmico](../validation/s2-release-review.md).
- [Posición solar en tiempo real](../earth-real-time-sun.md): independiente del año climático seleccionado.

## Tareas de Diego en ClickUp

- [S2-T4 — hexágonos y mapas de calor](https://app.clickup.com/t/86e3bamzx).
- [S2-T4.1 — altura dinámica e inspección](https://app.clickup.com/t/86e3ban00).
- [S2-T4.2 — paleta térmica](https://app.clickup.com/t/86e3ban03).
- [S2-T4.3 — optimización](https://app.clickup.com/t/86e3ban05).

La implementación utiliza una `InstancedMesh` compartida y selección BVH. No afirma que el hexbin nativo de Globe.gl esté instanciado ni que H3 admita resolución fraccionaria. Los datos anuales no se convierten en pendientes ni en sumas absolutas.

## Significado de los colores

Rojo significa una anomalía positiva respecto al promedio de referencia; azul, una negativa. El hielo puede tener anomalías positivas y continuar bajo cero. La demo tiene una referencia ficticia, no una climatología NASA observada. Los números, alturas y dominio −2…+2 °C permanecen iguales al reforzar el contraste cromático.

## Límite de la validación de rendimiento

Las mediciones corresponden a Edge en una RTX 4060. El tamaño móvil se prueba en ese mismo equipo, no en un teléfono físico. La media supera 60 FPS en escritorio; existen frames aislados de transición por encima de 16,7 ms. La certificación móvil real y la adaptación específica de densidad hexagonal para hardware de baja potencia permanecen pendientes de S2-T4.3. La calidad de las texturas terrestres sí cuenta con un perfil móvil existente.
