# NASA Space Apps Challenge 2026 — Official Submission Dossier
**Challenge:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=details)  
**Local Event:** Neiva, Colombia  
**Project Name:** NASA Earth System Trend Detective  
**Live Application URL:** [https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app)  
**Production API:** [https://nasa-trend-detective-api-72rq.onrender.com](https://nasa-trend-detective-api-72rq.onrender.com)  
**Official Repository:** [https://github.com/nasa-earth-detectives/nasa-project](https://github.com/nasa-earth-detectives/nasa-project)  

---

## 1. High-Level Project Summary (Overview)

### Project Title
**NASA Earth System Trend Detective (Interactive 3D Climate Diagnostics & Statistical Trend Analysis)**

### Problem & Need Identified
Earth observation data collected by NASA satellites over decades—spanning surface temperature, vegetation indices, ice sheet mass, and atmospheric carbon—exceeds petabytes of information. However, for educators, high school students, researchers, and citizen scientists, extracting rigorous long-term climate trends remains overwhelmingly complex. Users face high barriers: downloading massive NetCDF/HDF files, configuring Python or scientific GIS tools, and dealing with non-transparent statistical calculations that often obscure whether observed changes are statistically meaningful or merely natural climate variability.

### Challenge Addressed
Our project responds directly to NASA's **"Be An Earth System Trend Detective!"** challenge. We empower users to act as planetary investigators: selecting any terrestrial coordinates or ecosystem biome, inspecting multi-decade historical records, and automatically computing statistical significance to uncover real climate trends across interconnected Earth systems.

### Developed Solution
We developed **NASA Earth System Trend Detective**, a high-performance, web-based Earth observatory combining:
1. **Interactive 4D Planetary Globe:** Rendered at 60 FPS in WebGL/Three.js with NASA Blue Marble, night-lights textures, and accurate orbits of NASA Earth observation satellites (Terra, Aqua, GRACE-FO, OCO-2).
2. **Columnar High-Speed Analytics Engine:** Built on DuckDB OLAP and .NET 10 Clean Architecture, executing spatial and temporal slicing over real NASA datasets in sub-millisecond query windows without client-side lag.
3. **Automated Non-Parametric Statistics:** Real-time computation of the **Mann-Kendall rank test** (detecting monotonic trends with $p$-value and $Z$-score) paired with **Sen's Slope Estimator** (calculating robust median rates of change resistant to outliers).
4. **Student & Citizen Scientist Empowerment:** Featuring 1-click curated missions (Arctic Amplification with real GISTEMP data, Greenland Ice Loss, Sahel Greening, and Atmospheric CO2), an accessible student climate glossary, biophysical regional context detection, and raw CSV data exports.

### Importance & Real-World Utility
This solution transforms abstract numbers into actionable, verifiable scientific insights. By democratizing access to NASA climate records and statistical tests, it provides schools, universities, policymakers, and local communities with an interactive laboratory to detect climate impacts, evaluate environmental conservation efforts, and cultivate scientific literacy.

---

## 2. Technical Details & Architecture

### System Architecture
The application employs an enterprise Clean Architecture decoupled into a high-throughput backend and an ultra-responsive frontend:

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Edge CDN                      │
│        React 19 + TypeScript + Three.js / Globe.gl     │
│   (3D Orbiting Satellites, 1-Click Missions, Glossary) │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / REST (JSON)
┌──────────────────────────▼─────────────────────────────┐
│                    Render Cloud VM                     │
│                .NET 10 Clean Architecture               │
│  (Controllers, Application Queries, Domain Entities)   │
└──────────────────────────┬─────────────────────────────┘
                           │ In-Memory Columnar Slices
┌──────────────────────────▼─────────────────────────────┐
│                 DuckDB In-Memory OLAP                  │
│    GISTEMP v4, MODIS NDVI, GRACE-FO, OCO-2 Parquet/CSVs│
└────────────────────────────────────────────────────────┘
```

### Technical Tools & Languages
- **Programming Languages:** C# (.NET 10), TypeScript (strict mode), SQL (DuckDB dialect), Modern CSS3 with Design Tokens.
- **Frontend Frameworks & Libraries:** React 19, Vite, Three.js, Globe.gl, Lucide Icons, Canvas 2D/3D overlays.
- **Backend & Scientific Engine:** ASP.NET Core (.NET 10), DuckDB.NET (embedded in-memory columnar database), MathNet.Numerics / custom non-parametric statistical kernels.
- **Hosting & Infrastructure:** Vercel (Production Frontend SPA), Render (Containerized Docker Web Service with 256MB DuckDB memory guard & 2 compute threads).

### Scientific Algorithms Implemented
- **Mann-Kendall Trend Test:** Evaluates the relative frequency of increases versus decreases in chronological observations. Calculates the Kendall score $S$, variance $\text{Var}(S)$, and standardized test statistic $Z$. Computes two-tailed $p$-values to verify trend significance at the 95% confidence level ($p < 0.05$).
- **Sen's Slope Estimator:** Calculates the median of all pairwise slopes between chronological points $\frac{x_j - x_k}{j - k}$. Provides an unbiased, outlier-resilient slope measurement representing the true annual rate of change in observed physical units ($^\circ\text{C}/\text{year}$, $\text{NDVI}/\text{decade}$, $\text{cm EWH}/\text{year}$).

---

## 3. NASA Data & Resources Declaration

To ensure full compliance and global award eligibility, our project builds directly on primary NASA Earth science missions and open datasets:

| NASA Resource / Dataset | Mission / Source | Application in Project |
| :--- | :--- | :--- |
| **GISTEMP v4 (Surface Temperature Anomaly)** | NASA Goddard Institute for Space Studies (GISS) | Real global surface temperature anomalies ($1880\text{--}2024$) mapped into 3D hexagonal prisms and time-series trend analysis. |
| **MODIS Vegetation Indices (NDVI)** | Terra / Aqua Satellites (NASA EOSDIS / LP DAAC) | Decadal vegetation greenness and desertification dynamics across key biomes (Sahel, Amazon Basin). |
| **GRACE & GRACE-FO Mass Anomaly** | Gravity Recovery and Climate Experiment (NASA JPL) | Terrestrial water storage and polar ice mass balance anomalies expressed in Equivalent Water Height (EWH). |
| **OCO-2 Carbon Dioxide ($X_{\text{CO}_2}$)** | Orbiting Carbon Observatory-2 (NASA JPL) | Column-averaged atmospheric carbon dioxide mole fraction tracking global greenhouse gas accumulation. |
| **NASA Visible Earth (Blue Marble & Black Marble)** | NASA Earth Observatory | High-fidelity photorealistic day and night planetary sphere textures rendered on the 3D globe. |
| **Satellite Orbital Elements & Meshes** | NASA Mission Trajectories & 3D Models | Real-time orbital propagation and 3D visual representation of Terra, Aqua, GRACE-FO, and OCO-2 spacecraft. |

### How NASA Resources Inspired the Solution
The sheer scope of NASA's Earth Observing System inspired us to treat the planet as a synchronized biological and physical system. Instead of viewing temperature or vegetation in isolation, our platform lets users witness how ocean currents, atmospheric carbon, and polar ice loss correlate across continents.

---

## 4. Artificial Intelligence (AI) Declaration

In full accordance with Space Apps Challenge guidelines:
- **AI Tools Used:** Google Gemini 2.5/Pro (via Antigravity development environment) was utilized as an engineering assistant for architectural refactoring, unit test design, code optimization, and documentation structuring.
- **Code & Design Authenticity:** All business logic, scientific algorithms, DuckDB queries, and 3D visualization shaders were reviewed, integrated, tested, and validated by our human engineering and scientific team.
- **Zero Trademark Violation:** No AI-generated or altered NASA logos, mission emblems, flags, or official agency graphics were created or modified. All NASA logos and imagery adhere strictly to NASA Media Usage Guidelines.

---

## 5. Demo Video Pitch & Presentation Structure (30-Second Script)

**Target Demo Format:** 30-Second High-Impact Video Pitch (1080p, 60 FPS, English voiceover/subtitles).

| Second Window | Visual Scene | Voiceover Narrative (English) |
| :--- | :--- | :--- |
| **00:00 – 00:06** | Photorealistic 3D Earth spinning with orbiting NASA satellites (Terra, Aqua, GRACE-FO). | *"Earth sends us signals every second. But how do we prove what's changing?"* |
| **00:06 – 00:14** | Click on **'Arctic Amplification'** 1-click mission; globe orbits to the North Pole; heat hexagons illuminate. | *"Introducing NASA Earth System Trend Detective. In one click, investigate decades of real NASA GISTEMP records."* |
| **00:14 – 00:22** | Detective Card opens showing Mann-Kendall statistics ($p < 0.001$, $Z = +4.12$), Sen's slope line, and Regional Biome context. | *"Our in-memory DuckDB engine computes instant Mann-Kendall and Sen's slope statistics, proving real climate trends."* |
| **00:22 – 00:30** | Toggle satellite orbits and click 'Download CSV'; student glossary modal opens with closing call to action. | *"From classrooms to policymakers: science made clear, interactive, and actionable. Be a planetary detective today."* |

---

## 6. Official Judging Criteria Alignment

1. **Impact:** Lowers the entry barrier to planetary climate science for over 1.5 billion students, educators, and citizens worldwide by removing complex coding prerequisites.
2. **Creativity:** Bridges 60 FPS Three.js gaming graphics with serious academic non-parametric statistics and embedded OLAP technology.
3. **Validity:** Implements rigorous peer-reviewed statistical tests (Mann-Kendall test, Sen's median slope) with transparent methodology and accessible explanations.
4. **Relevance:** Directly integrates five distinct NASA missions and public datasets, providing authentic real-world utility for the *Earth System Trend Detective* challenge.
5. **Presentation:** Intuitive, mission-driven UI featuring accessible typography, high-contrast dark space theme, 1-click guided cases, and bilingual documentation.
