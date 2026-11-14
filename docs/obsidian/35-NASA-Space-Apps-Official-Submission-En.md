# NASA Space Apps Challenge 2026 — Official Submission Dossier
**Challenge:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=details)  
**Local Event:** Neiva, Colombia  
**Project Name:** NASA Earth System Trend Detective  
**Live Application URL:** [https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app)  
**Production API:** [https://nasa-trend-detective-api-72rq.onrender.com](https://nasa-trend-detective-api-72rq.onrender.com)  
**Official Repository:** [https://github.com/nasa-earth-detectives/nasa-earth-trend-detective](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective)
**Master Team Dossier (Google Docs):** [Proyecto Nasa — Documento Maestro](https://docs.google.com/document/d/11M8ZQrT3TRZ6_gqd6MHrb-t6v0x3BwdOTVZWiQskOhs/edit)
**Hackathon Plan & ClickUp Sync:** [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]] | [[19-Trazabilidad-ClickUp-Sprint-4]]  

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

## 3. NASA Data & Space Agency Partner Resources Declaration

To ensure full compliance and global award eligibility, our project builds directly on primary NASA Earth science missions, partner space agency datasets, and open scientific references:

| Resource / Dataset | Agency / Source | Application in Project |
| :--- | :--- | :--- |
| **GISTEMP v4 (Surface Temperature Anomaly)** | NASA Goddard Institute for Space Studies (GISS) | Real global surface temperature anomalies ($1880\text{--}2024$) mapped into 3D hexagonal prisms and decade-scale trend analysis. |
| **MODIS NDVI & AppEEARS / Giovanni** | NASA EOSDIS / LP DAAC / GES DISC | Data extraction and normalized greening/desertification series (MOD13A2/MYD13A2) across key biomes (Sahel, Amazon Basin) packaged for credential-free reproducibility. |
| **Hydrology Time Series** | NASA GES DISC | Hydrological time-series methodology and surface/subsurface water balance trend exploration. |
| **GRACE & GRACE-FO Mass Anomaly** | NASA JPL | Terrestrial water storage and polar ice mass balance anomalies expressed in Equivalent Water Height (cm EWH, e.g., Greenland ice loss case). |
| **OCO-2 Carbon Dioxide ($X_{\text{CO}_2}$)** | NASA JPL | Column-averaged atmospheric carbon dioxide mole fraction tracking global greenhouse gas accumulation. |
| **NASA NTRS 20090042747 (SeaWiFS Chlorophyll)** | NASA Technical Reports Server | Methodological reference for coastal/river-influenced time-series construction and non-parametric statistical significance testing. |
| **NASA Visible Earth (Blue/Black Marble) & Orbits** | NASA Earth Observatory | High-fidelity photorealistic day/night textures and 3D orbital propagation of Terra, Aqua, GRACE-FO, and OCO-2 spacecraft. |
| **SWOT Mission & RADARSAT Constellation (RCM) / Geo.ca** | Canadian Space Agency (CSA) / NASA-CNES | Surface water topography and coastal/wetland/maritime Earth observation frameworks extending our hydrological monitoring scope. |
| **KNMI Climate Explorer** | Royal Netherlands Meteorological Institute | Independent scientific benchmark used to cross-validate Mann-Kendall $p$-values and Sen's slopes across core planetary hotspots. |
| **NOAA NCEI Climate Data Online (CDO)** | NOAA National Centers for Environmental Information | Historical station-level weather and climate records complementing gridded satellite pixels. |

### How NASA Resources Inspired the Solution
The sheer scope of NASA's Earth Observing System—and complementary hydrological missions from partner agencies like the Canadian Space Agency—inspired us to treat the planet as a synchronized biological and physical system. Instead of viewing temperature, vegetation, or surface water in isolation, our platform lets users witness how ocean currents, atmospheric carbon, hydrology, and polar ice loss correlate across continents.

---

## 4. Artificial Intelligence (AI) Declaration

In full accordance with Space Apps Challenge guidelines:
- **AI Tools Used:** Google Gemini (via Antigravity IDE) and GitHub Copilot were utilized strictly as software engineering and productivity support for architectural refactoring, responsive CSS debugging, unit test design, and documentation structuring.
- **Human Verification & Integrity:** All scientific algorithms (Mann-Kendall, Sen's Slope), physical interpretations, DuckDB analytical queries, and UI/UX integration decisions were manually reviewed, tested, and validated by our 6-member engineering and climate physics team.
- **Zero Trademark Violation & Watermarking Rule:** No generative AI tools were used to fabricate scientific observations, nor to generate, contain, or modify any NASA logos, flags, mission emblems, or agency visual identifiers. Any AI-generated visual illustrations used externally carry a visible watermark disclosing AI origin.

---

## 5. Project Demonstration — Option A: 7-Slide English Presentation

**Selected Official Demo Option:** **Option A — Presentation: maximum 7 slides (including cover slide)**, all text in **English**, hosted publicly and verified in incognito mode prior to submission, paired with our live production web observatory ([https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app)).

| Slide # | Suggested English Title | Key Content & Visual Evidence |
| :---: | :--- | :--- |
| **Slide 1** | **NASA Earth System Trend Detective** | Cover slide: *Interactive 4D Observatory & Statistical Climate Laboratory*, 6-member Neiva (Colombia) team, live app URL, and repository link. |
| **Slide 2** | **The Challenge: Signal vs. Noise Across Terabytes** | Why non-specialists struggle to pick Earth science variables and prove trend significance; directly framing the 4 challenge questions (*What, Where, How Much, Significant*). |
| **Slide 3** | **Interactive 4D Globe & Instant Trend Inspector** | Live 1080p UI screenshots: 3D hexagons, 2000–2026 Time Slider, 1-click Detective Missions (Arctic Amplification, Greenland, Sahel, Mauna Loa), regional biome context, and CSV export. |
| **Slide 4** | **Powered by NASA & Space Agency Partner Data** | Data provenance integration: **GISTEMP v4**, **AppEEARS / Giovanni / Hydrology Time Series**, **GRACE-FO**, **OCO-2**, **SeaWiFS (NTRS)**, **CSA SWOT/RCM**, **KNMI**, and **NOAA CDO**. |
| **Slide 5** | **Scientific Rigor & Physical Validation** | **Mann-Kendall** ($S$, tie-corrected $\text{Var}(S)$, $Z$, $p < 0.05$), **Sen's Slope** (95% CI), opposing 3D teleconnections, EWH physics, lag-1 autocorrelation checks, and KNMI cross-validation table. |
| **Slide 6** | **Scalable Cloud Architecture (.NET 10 + DuckDB)** | Architecture flow diagram: Vercel Edge (`React 19 + Three.js / Globe.gl 60 FPS`) $\rightarrow$ Render (`ASP.NET Core .NET 10 Clean Architecture + Rate Limiting + Brotli + DuckDB OLAP 256 MB`). |
| **Slide 7** | **Impact, Educational Access & Roadmap** | Student-friendly glossary impact, classroom and municipal water/climate monitoring applications, and post-hackathon live SWOT/AppEEARS expansion. |

### 45-Second Judge Elevator Pitch (English)
> *"Hello judges, we are the NASA Earth System Trend Detective team from Neiva, Colombia. Earth's climate generates petabytes of satellite observations, yet most citizens and students cannot easily test whether local changes are statistically significant or just natural noise. Our web platform brings NASA's GISTEMP, AppEEARS, Hydrology, GRACE, and OCO-2 insights together with CSA SWOT water perspectives on an interactive 60-FPS 3D globe powered by a .NET 10 and DuckDB analytical engine. With one click, anyone can explore historical trends, compare opposing teleconnected regions, verify statistical significance using Mann-Kendall and Sen's Slope tests, and export evidence-based CSV reports. We make Earth system science transparent, fast, and accessible for everyone. Thank you!"*

---

## 6. Official Judging Criteria Alignment

1. **Impact:** Lowers the entry barrier to planetary climate science for students, educators, municipal planners, and citizens worldwide by removing complex coding prerequisites.
2. **Creativity:** Bridges 60 FPS Three.js gaming graphics with serious academic non-parametric statistics and embedded DuckDB OLAP technology.
3. **Validity:** Implements rigorous peer-reviewed statistical tests (Mann-Kendall test, Sen's median slope), physical climate validation (`[PHYS-T1..T5]`), and independent cross-validation against KNMI Climate Explorer.
4. **Relevance:** Directly integrates primary NASA missions and open data tools (GISTEMP v4, AppEEARS, Giovanni, Hydrology Time Series, GRACE-FO, OCO-2, Blue/Black Marble, NTRS SeaWiFS) alongside CSA SWOT/RCM and NOAA CDO resources for the *Be An Earth System Trend Detective!* challenge.
5. **Presentation:** Intuitive, mission-driven UI featuring accessible typography, high-contrast dark space theme, 1-click guided cases, student glossary, and a focused 7-slide narrative.
