# 🔬 Rigor Científico: Mann-Kendall & Sen's Slope

Volver al [[00-Map-Of-Content]] | Responsable: [[03-Roles-y-Equipo#Johan Sebastian Olaya Reyes]]

---

## 🎯 Las 4 Preguntas Oficiales de la NASA

| Interrogante NASA | Solución Técnica en Nuestra Plataforma |
| :--- | :--- |
| **1. ¿Qué está cambiando?** | Detección multivariable: GISTEMP ($T^\circ$), MODIS (NDVI), GRACE-FO (Hielo), OCO-2 ($CO_2$). |
| **2. ¿Dónde está cambiando?** | Mapeo geoespacial 3D por celdas latitud/longitud en [[01-Arquitectura-Monorrepo]]. |
| **3. ¿Cuánto está cambiando?** | Estimador no paramétrico de **Pendiente de Sen (*Sen's Slope*)** por década. |
| **4. ¿Es significativo?** | Evaluación matemática mediante el **Test de Tendencia de Mann-Kendall** ($p < 0.05$). |

---

## 📐 Formulación Matemática

### 1.  Test de Mann-Kendall $S$
Compara cada observación con todas las posteriores y suma los signos de sus diferencias:
```math
S = \sum_{k=1}^{n-1} \sum_{j=k+1}^{n} \text{sign}(x_j - x_k)
```
Donde:

$$
\text{sign}(\theta) =
\begin{cases}
+1 & \text{si } \theta > 0 \\
0 & \text{si } \theta = 0 \\
-1 & \text{si } \theta < 0
\end{cases}
$$

Así, cada comparación aporta $+1$ si el valor posterior es mayor, $-1$ si es menor y $0$ si ambos valores son iguales. Por lo tanto, el signo de $S$ indica la dirección de la tendencia:

- **$S>0$:** hay más pares crecientes que decrecientes.
- **$S<0$:** hay más pares decrecientes que crecientes.
- **$S=0$:** ambos tipos de pares se compensan, sin predominio de una dirección.

El signo de $S$ no determina, por sí solo, si la tendencia es estadísticamente significativa.

### Varianza de $S$ con corrección por valores repetidos

Para evaluar si existe una tendencia estadísticamente significativa, suponemos inicialmente que la variable estudiada no muestra una tendencia general a aumentar o disminuir con el tiempo. Esta suposición se conoce como **hipótesis nula ($H_0$) de ausencia de tendencia monótona**.

Bajo esta hipótesis, los aumentos y las disminuciones entre pares de observaciones tienden a compensarse, por lo que el valor esperado de $S$ es cero. Sin embargo, las fluctuaciones aleatorias pueden producir valores distintos de cero. 

La varianza, $\text{Var}(S)$, describe cuánto puede variar $S$ por azar bajo esta hipótesis. Cuando existen **valores repetidos, llamados empates**, la varianza se calcula mediante:

```math
\text{Var}(S)=
\frac{
n(n-1)(2n+5)
-\displaystyle\sum_{k=1}^{g}t_k(t_k-1)(2t_k+5)
}{18}
```

Donde:

- $n$ es el número total de observaciones válidas.
- $g$ es el número de grupos de valores repetidos.
- $t_k$ es el número de observaciones en el grupo $k$.

Las comparaciones entre valores iguales aportan cero al cálculo de $S$. El término de corrección ajusta su varianza para tener en cuenta estos empates. Si no existen empates, dicho término es cero.

> **Nota:** Esta corrección contempla los valores repetidos, pero no corrige por estacionalidad ni autocorrelación temporal.

### 3. Test estadístico $Z$ 

El estadístico $Z$ permite evaluar qué tan lejos está el resultado observado de lo esperado bajo la hipótesis de ausencia de tendencia. Se calcula utilizando la desviación estándar de $S$, es decir, $\sqrt{\text{Var}(S)}$:

```math
Z =
\begin{cases}
\dfrac{S-1}{\sqrt{\text{Var}(S)}} & \text{si } S > 0 \\
0 & \text{si } S = 0 \\
\dfrac{S+1}{\sqrt{\text{Var}(S)}} & \text{si } S < 0
\end{cases}
```
El resultado se interpreta de dos maneras:

- **$Z>0$:** evidencia en dirección de una tendencia creciente.
- **$Z<0$:** evidencia en dirección de una tendencia decreciente.
- **Cuanto mayor sea $|Z|$**, más extremo es el resultado bajo la hipótesis de ausencia de tendencia y mayor es la evidencia contra ella.

> **Caso particular:** Si todos los valores son iguales, $S=0$ y $\text{Var}(S)=0$. La serie es constante y se asigna $Z=0$, evitando dividir entre cero.

#### Criterio de significancia:

**Veredicto al 95% de confianza:** Si $|Z| > 1.96$, la tendencia es **estadísticamente significativa ($p < 0.05$)**.

### 4. Pendiente de Sen (*Sen's Slope*)

Mientras que el test de Mann–Kendall evalúa la evidencia estadística de una tendencia, la **pendiente de Sen estima cuánto aumenta o disminuye la variable por unidad de tiempo**.

Para calcularla, obtenemos la tasa de cambio entre cada par de observaciones y tomamos la mediana de todas esas tasas:

```math
Q = \text{Mediana}\left(
\frac{x_j-x_k}{t_j-t_k}
\right),
\qquad j>k
```

Donde:

- $x_j$ y $x_k$ son los valores de la variable en dos momentos distintos.
- $t_j$ y $t_k$ son los tiempos correspondientes, con $t_j>t_k$.
- $Q$ es la pendiente estimada de la serie.

Su interpretación es:

- **$Q>0$:** la variable presenta una tendencia creciente.
- **$Q<0$:** la variable presenta una tendencia decreciente.
- **$Q=0$:** la mediana de las tasas de cambio es cero.

Por ejemplo, una pendiente de $Q=0.02$ °C/año corresponde a un aumento estimado de **0.2 °C por década**.

Al utilizar la mediana, este estimador es menos sensible a valores extremos que una pendiente obtenida mediante mínimos cuadrados. Sin embargo, no implica que la variable cambie exactamente a esa tasa en cada intervalo.

> **Tiempo y unidades:** El denominador $j-k$ puede utilizarse cuando las observaciones están igualmente espaciadas; en ese caso, la pendiente queda expresada por intervalo de observación. Para obtener unidades físicas claras, como °C/año, utilizamos los tiempos reales expresados en la unidad elegida.

> **Significancia:** Una pendiente distinta de cero no demuestra, por sí sola, que la tendencia sea estadísticamente significativa. La magnitud del cambio y la evidencia estadística deben evaluarse por separado.

### Fuente

- [Statistical Test Methods to Detect Trends in Time Series Data](https://medium.com/@snp.kriss/statistical-test-methods-to-detect-trends-in-time-series-data-b361a0ec530b#542a).

---

## 🔄 Motor de Tendencias Opuestas (*Opposing Trends*)
- **Caso Ártico vs Atlántico Norte:** Amplificación térmica acelerada en el Ártico ($+0.7^\circ\text{C}$/década) vs enfriamiento relativo en el giro subpolar del Atlántico Norte.
- **Caso China vs Amazonas:** Reverdecimiento intensivo por reforestación vs degradación y pérdida de biomasa en la cuenca amazónica.
