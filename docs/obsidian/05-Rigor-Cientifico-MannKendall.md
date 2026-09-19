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

### 1. Estadístico de Tendencia $S$
Evalúa la monotonicidad temporal sumando los signos de todas las parejas temporales:
$$S = \sum_{k=1}^{n-1} \sum_{j=k+1}^{n} \text{sign}(x_j - x_k)$$

Donde:
$$\text{sign}(\theta) = \begin{cases} +1 & \text{si } \theta > 0 \\ 0 & \text{si } \theta = 0 \\ -1 & \text{si } \theta < 0 \end{cases}$$

### 2. Varianza $\text{Var}(S)$ con Corrección por Empates (Ties)
$$\text{Var}(S) = \frac{n(n-1)(2n+5) - \sum_{i=1}^m t_i(t_i-1)(2t_i+5)}{18}$$

### 3. Puntaje Estandarizado $Z$ y Veredicto
$$Z = \begin{cases} \frac{S - 1}{\sqrt{\text{Var}(S)}} & \text{si } S > 0 \\ 0 & \text{si } S = 0 \\ \frac{S + 1}{\sqrt{\text{Var}(S)}} & \text{si } S < 0 \end{cases}$$

- **Veredicto al 95% de confianza:** Si $|Z| > 1.96$, la tendencia es **Estadísticamente Significativa ($p < 0.05$)**.

### 4. Pendiente de Sen (*Sen's Slope*)
Calcula la mediana de las tasas de cambio de todas las parejas:
$$Q = \text{Mediana}\left( \frac{x_j - x_k}{j - k} \right) \quad \forall \, j > k$$

---

## 🔄 Motor de Tendencias Opuestas (*Opposing Trends*)
- **Caso Ártico vs Atlántico Norte:** Amplificación térmica acelerada en el Ártico ($+0.7^\circ\text{C}$/década) vs enfriamiento relativo en el giro subpolar del Atlántico Norte.
- **Caso China vs Amazonas:** Reverdecimiento intensivo por reforestación vs degradación y pérdida de biomasa en la cuenca amazónica.
