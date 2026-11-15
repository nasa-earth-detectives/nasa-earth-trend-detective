# NASA Space Apps Challenge 2026 — Official Submission Dossier
**Challenge:** [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/?tab=details)  
**Local Event:** Neiva, Colombia  
**Project Name:** NASA Earth System Trend Detective  
**Live Application URL:** [https://nasa-earth-trend-detective.vercel.app](https://nasa-earth-trend-detective.vercel.app)  
**Production API:** [https://nasa-trend-detective-api-72rq.onrender.com](https://nasa-trend-detective-api-72rq.onrender.com)  
**Official Repository:** [https://github.com/nasa-earth-detectives/nasa-earth-trend-detective](https://github.com/nasa-earth-detectives/nasa-earth-trend-detective)  
**Master Team Dossier (Google Docs):** [Proyecto Nasa — Documento Maestro](https://docs.google.com/document/d/11M8ZQrT3TRZ6_gqd6MHrb-t6v0x3BwdOTVZWiQskOhs/edit)  
**Hackathon Plan & ClickUp Sync:** [[36-Plan-Hackathon-Neiva-Nuevas-Fuentes-NASA-CSA]] | [[19-Trazabilidad-ClickUp-Sprint-4]]  
**Evidence for every figure below:** [[37-MERRA2-Datos-Reales-y-Casos-Opuestos]] | How it works: [[38-Como-Funciona-El-Detective-De-Tendencias]]  

> **Status on 2026-11-14 (Updated for Official DB-Runtime Portal Submission).** This dossier provides ready-to-paste copy matching every field of the NASA Space Apps Challenge submission form, strictly grounded in implemented and verified functionality (through PRs `#75`–`#80`). Note: PR `#77` (`2000–2025` seeded + live NASA API validation), PR `#78` (this dossier & docs), and PR `#79` (instant **EN | ES** bilingual toggle, React Doctor clean) target `development` → `qa` → `production` alongside `#80` before the **November 15, 2026 (11:59 PM)** deadline.

---

## 0. Portal Copy-Paste Checklist (`DB-Runtime` Submission Form)

| Portal Field | Exact Value / Where to Copy | Pre-Submission Check |
| :--- | :--- | :--- |
| **Project Name \*** | `NASA Earth System Trend Detective` | Matches live app title and GitHub repository. |
| **Summary \*** *(50–200 words, <= 1,500 chars)* | Copy §1.1 **Ready-to-Paste Summary** below (145 words). | Verify live char/word counter under `1,500`. |
| **Project Demonstration \*** | Public URL to **<= 7-slide presentation (Option A)** in English (Title/Cover included), hosted on Google Slides / Drive / PDF / GitHub with *Anyone with link can view* (no password/login). | Test URL in incognito browser before final submit. |
| **Project \*** | `https://nasa-earth-trend-detective.vercel.app` (and repository `https://github.com/nasa-earth-detectives/nasa-earth-trend-detective`). | Refresh `PERSONAL_REPO_SYNC_TOKEN` in GitHub Secrets and verify `production` deploy returns HTTP `200`. |
| **Project Details \*** | Copy §1.2 + §2 (covers all 6 Space Apps questions: how it works, benefits, impact, stack, creativity, factors considered + SI transparency). | Ensure clean formatting in the portal editor. |
| **Use of Super Intelligence (SI) \*** | Select applicable SI options for code/documentation/engineering acceleration; **never** check "used to generate NASA branding/logos" or "fabricated data". See §4. | Verify visible watermark/metadata rules if external SI media is ever added to slides/video. |
| **NASA Data \*** | Add each link from §3.1 **Portal Link Table (`Link Text` / `Link Url`)**. | At least one verified NASA resource is mandatory for Global Award eligibility. |
| **Space Agency Partner & Other Data** | Add each link from §3.2 **Partner & Open-Source Link Table (`Link Text` / `Link Url`)**. | Lists all third-party tiles, libraries, and platforms used. |
| **Verification & Judging Lock** | Confirm Terms & Conditions + Original Work; toggle `Lock`, click `Save Progress`, then click **`Submit for Judging`** before **Sun Nov 15, 11:59 PM**. | Only clicks on `Submit for Judging` before the deadline are evaluated. |

---

## 1. High-Level Project Summary (`Summary *` & Overview)

### 1.1 Ready-to-Paste `Summary *` (145 words)

> Earth science datasets span thousands of variables across separate archives, making it hard for students and citizens to distinguish real long-term climate trends from natural year-to-year variability—or see how the same variable trends in opposite directions across regions. **NASA Earth System Trend Detective** is an interactive 3D WebGL Earth-observation platform with instant **English / Spanish (`EN | ES`)** switching that answers the challenge's four questions: **what** is changing, **where**, **how much**, and whether it is statistically **significant**. Users select a variable, location, and time period across **9 real NASA datasets**: GISTEMP v4 surface temperature; MERRA-2 air temperature, precipitation, evaporation, and soil wetness; GPM IMERG precipitation; MODIS Terra NDVI; GRACE/GRACE-FO water/ice mascons; and OCO-2 column CO₂. An embedded DuckDB + .NET 10 engine computes live Mann-Kendall tests, Sen's slope with 95% confidence intervals, linear regression t-tests, iterative lag-1 pre-whitening, and 5% Benjamini-Hochberg FDR, cross-validated against SciPy.

### 1.2 Project Title & Breakdown (`Project Details *` Part 1)
**NASA Earth System Trend Detective (Interactive 3D Globe & Statistical Trend Analysis)**

### Problem & Need Identified
Earth science offers thousands of variables measured by missions or produced by models. For a
student or a citizen it is hard to pick one that might be changing, and harder to tell whether a
change is real or just year-to-year noise. The same variable can also rise in one region and fall
in another.

### Challenge Addressed
The tool answers the four questions of **"Be An Earth System Trend Detective!"** for any place on
Earth: **what** is changing, **where**, **how much**, and whether the change is statistically
**significant**.

### Developed Solution (What It Does & How It Works)
1. **Guided briefing in three choices.** Pick a variable, a place, and a period; all **9/9 variables**
   carry real NASA observations, and the 3D globe flies to the location while you explore.
2. **Time series for every 2° cell**, with Sen's slope line, up to 45 years (`1981–2025` / `2000–2026`).
3. **A verdict with three statistical methods:** Mann-Kendall with Sen's slope, the 95 % confidence
   interval of that slope, and a t-test on linear regression. The card states whether methods agree
   and whether the trend survives iterative lag-1 pre-whitening (`r₁` persistence correction).
4. **A global 3D trend map** (Sen's slope per cell), reporting exact counts of cells that remain
   significant after persistence correction and 5 % Benjamini-Hochberg false-discovery control.
5. **Opposite trends, measured live.** A case board compares Central-West Brazil against Bangladesh
   across four variables simultaneously, with geodesic teleconnection arcs across the 3D globe.
6. **Accessible by design:** instant **`EN | ES`** toggle in the header with URL language sharing
   (`?lang=en|es`), plain-language glossary, guided tour, keyboard/mobile support, and CSV export.

### Benefits, Intended Impact, Creativity & Factors Considered
- **Benefits & Impact:** Turns abstract climate statements into a hands-on classroom experiment with
  zero setup—showing non-significant and fragile trends as honest scientific findings rather than
  hiding uncertainty. Bilingual **EN / ES** access widens classroom adoption across Latin America
  and international audiences.
- **Creativity:** Couples a NASA-grade Earth-science instrument interface (real-time USNO solar
  illumination, lunar position, Black Marble night lights, and NASA 3D spacecraft orbits for Terra,
  Aqua, GRACE-FO, and OCO-2) directly to live statistical queries.
- **Key Engineering Factors Considered:** Embedded memory efficiency (256 MB DuckDB limits with Parquet
  seeds for 100 % offline reliability without API rate-limit failures), false-positive control under
  autocorrelation via AR(1) simulation, strict TypeScript/C# contracts, and modular rendering at 60 FPS.

---

## 2. Technical Details & Architecture

```
┌────────────────────────────────────────────────────────┐
│                     Vercel (frontend)                  │
│        React 19 + TypeScript + Three.js / Globe.gl     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTPS / REST (JSON)
┌──────────────────────────▼─────────────────────────────┐
│                     Render (backend)                   │
│   ASP.NET Core (.NET 10), Clean Architecture, Brotli   │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          DuckDB (embedded, 256 MB memory limit)        │
│ Parquet seeds: GISTEMP, MERRA-2 (4), GPM, MODIS NDVI,  │
│ GRACE, OCO-2. Each seed ships with a provenance file   │
└────────────────────────────────────────────────────────┘
```

### Technical Tools & Languages
- **Languages:** C# (.NET 10), TypeScript (strict mode), SQL (DuckDB), Python (data conversion & Blender asset preparation), CSS.
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Three.js, Globe.gl, `three-slippy-map-globe`, `lucide-react`, `driver.js`, and custom **`EN | ES`** bilingual i18n dictionary architecture.
- **Backend:** ASP.NET Core (.NET 10, Clean Architecture), DuckDB.NET embedded columnar store (256 MB memory budget), Brotli compression, IP rate limiting. Statistical algorithms are implemented natively in C# with zero numerical third-party lock-in and cross-checked against SciPy.
- **Data Pipeline & 3D Asset Prep:** Python scripts convert NASA Zarr stores, NetCDF, GIBS colormapped tiles, and GSFC GRACE mascons to a common 2° grid; Blender + Google Draco normalize official NASA 3D spacecraft meshes.
- **Hosting & CI/CD:** Vercel (frontend), Render (Docker .NET API web service), GitHub Actions (automated builds, `<= 300` lines/file gate, React Doctor, scientific tests, Docker image validation).

### Scientific Algorithms Implemented
- **Mann-Kendall trend test** with tie correction: score $S$, $\text{Var}(S)$, $Z$ and two-sided $p$-value.
- **Sen's slope** (median of pairwise slopes) with its 95 % confidence interval (Sen, 1968).
- **t-test on the slope of a least-squares regression**, with standard error and 95 % interval.
- **Serial correlation:** Mann-Kendall repeated after iterative pre-whitening (Zhang et al., 2000;
  Wang and Swail, 2001). The method was chosen by simulation, not by reputation: on 2,000 trend-free
  AR(1) series per case the classic test gives 4–38 % false positives, the widely used TFPW 5–50 %, and
  the adopted method 3.5–19 %. It halves false positives; it does not remove them.
- **Multiple testing:** Benjamini-Hochberg false discovery rate (5 %) across all cells of a map.
- **Cross-validation:** Sen's slope, its interval, the regression slope, standard error, $t$ and
  interval match SciPy 1.18.1 to 6 decimals on three series, one of them real MERRA-2 data; the
  $p$-value matches within a relative error of $10^{-6}$. The Benjamini-Hochberg adjustment matches
  SciPy to 9 decimals. 195 automated backend tests pass on `development` (expanded in PR #77 with 14 seeded `2000–2025` checks and 3 live NASA API validation tests).

### Measured Results (2° grid)
Cells with a significant trend: Mann-Kendall at 95 % with no correction, then after discounting
persistence, then also controlling the false discovery rate at 5 %. The last two columns split that
final count.

| Variable (period) | Cells | Uncorrected | Persistence-corrected | + FDR 5 % | Increase | Decrease |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: |
| Surface temperature, GISTEMP (2000–2026) | 16,021 | 9,843 | 8,449 | 7,117 | 7,117 | 0 |
| Air temperature, MERRA-2 (1981–2025) | 16,200 | 12,043 | 11,176 | 10,727 | 9,952 | 775 |
| Precipitation, MERRA-2 (1981–2025) | 16,200 | 5,622 | 4,911 | 2,812 | 1,697 | 1,115 |
| Precipitation, GPM IMERG (1998–2025) | 16,200 | 4,667 | 4,070 | 2,297 | 2,065 | 231 |
| Land evaporation, MERRA-2 (1981–2025) | 4,573 | 1,764 | 1,465 | 941 | 645 | 296 |
| Root-zone soil moisture, MERRA-2 (1981–2025) | 4,573 | 1,891 | 1,293 | 737 | 502 | 235 |
| Vegetation index (NDVI), MODIS Terra (2000–2025) | 3,094 | 1,287 | 1,211 | 894 | 830 | 64 |
| Water and ice mass, GRACE / GRACE-FO (2002–2025) | 5,832 | 4,358 | 3,684 | 3,517 | 1,805 | 1,712 |
| Column CO₂, OCO-2 (2015–2025) | 3,139 | 3,139 | 3,138 | 3,138 | 3,138 | 0 |

Where the signal is strong (temperature, ice, CO₂) the corrections change little; where it is weak and
noisy (precipitation, soil moisture) about half of the "significant" cells do not survive.

**Opposite trends in two regions** (Sen's slope per decade; all eight remain significant after the
persistence correction, the weakest being air temperature in Bangladesh, $p = 0.015$):

| Variable | Central-West Brazil (19° S, 53° W) | Bangladesh (23° N, 91° E) |
| :--- | :--- | :--- |
| Air temperature | +0.585 °C | −0.112 °C |
| Precipitation | −0.528 mm/day | +1.53 mm/day |
| Root-zone soil moisture | −0.0467 | +0.0604 |
| Land evaporation | −0.395 mm/day | +0.311 mm/day |

---

## 3. NASA Data & Space Agency Partner Resources Declaration

### 3.1 Portal-Ready `NASA Data *` Links (`Link Text` / `Link Url`)

Use `Add New Link` on the Space Apps portal with the exact rows below (all resources strictly verified in `backend/seed/*.provenance.json`, `docs/obsidian/earth-assets/`, and `frontend/src/`):

| Link Text (`NASA Data *`) | Link Url |
| :--- | :--- |
| `NASA GISTEMP v4 Surface Temperature Analysis` | `https://data.giss.nasa.gov/gistemp/` |
| `NASA POWER v10 (MERRA-2 & GPM IMERG Data Portal)` | `https://power.larc.nasa.gov/` |
| `NASA POWER MERRA-2 2m Air Temperature (T2M Zarr)` | `https://nasa-power.s3.amazonaws.com/merra2/temporal/power_merra2_annual_temporal_utc.zarr/T2M` |
| `NASA POWER GPM IMERG Precipitation (Zarr)` | `https://nasa-power.s3.amazonaws.com/imerg/temporal/power_imerg_annual_temporal_utc.zarr/IMERG_PRECTOT` |
| `NASA GIBS WMS (MODIS Terra NDVI MOD13A3 & OCO-2 XCO2)` | `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetCapabilities&VERSION=1.3.0` |
| `NASA GSFC GRACE/GRACE-FO Mascons RL06v2.0` | `https://earth.gsfc.nasa.gov/sites/default/files/geo/GSFC.glb_.200204_202606_RL06v2.0_OBP-ICE6GD.zip` |
| `NASA Blue Marble Next Generation (Base Map & Topography)` | `https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-map/` |
| `NASA Earth at Night — VIIRS Black Marble Maps` | `https://science.nasa.gov/earth/earth-observatory/earth-at-night/maps/` |
| `NASA Visible Earth — Blue Marble Clouds` | `https://visibleearth.nasa.gov/images/57747/blue-marble-clouds/77558l` |
| `NASA 3D Resources (Terra, Aqua, OCO-2, GRACE Models)` | `https://github.com/nasa/NASA-3D-Resources` |

### 3.2 Portal-Ready `Space Agency Partner & Other Data` Links

Add these verified third-party datasets, scientific libraries, and open-source tools under `Space Agency Partner & Other Data`:

| Link Text (`Partner / Other Data`) | Link Url | Role in Project |
| :--- | :--- | :--- |
| `Esri World Imagery (ArcGIS Location Platform)` | `https://developers.arcgis.com/rest/basemap-styles/arcgis-imagery-webmap-get/` | Optional close-zoom imagery tiles when API key is configured. |
| `Mapzen / AWS Open Data Terrarium Elevation Tiles` | `https://s3.amazonaws.com/elevation-tiles-prod/` | Global relief DEM height tiles in the 3D slippy Earth layer. |
| `GEBCO 08 Global Topography (via NASA BMNG)` | `https://www.gebco.net/` | Terrestrial height map (`0–6400 m`) for globe surface relief. |
| `U.S. Naval Observatory Solar & GAST Formulas` | `https://aa.usno.navy.mil/faq/sun_approx` | Subsolar position algorithms driving the real-time terminator. |
| `SciPy Statistical Reference` | `https://scipy.org/` | Independent cross-validation of Mann-Kendall, Sen's slope, t-test, and FDR. |
| `DuckDB & DuckDB.NET` | `https://duckdb.org/` | Embedded analytical Parquet SQL store (`<= 256 MB` RAM). |
| `ASP.NET Core (.NET 10)` | `https://dotnet.microsoft.com/` | Clean Architecture backend API and native statistical engine. |
| `React 19 & Vite` | `https://react.dev/` | Bilingual (`EN / ES`) UI components, hooks, and static build. |
| `Three.js & Globe.gl` | `https://threejs.org/` | WebGL 3D globe rendering, instanced hex columns, and orbital scene. |
| `Blender & Google Draco` | `https://www.blender.org/` | Mesh cleanup and lossless/compact `.glb` compression for satellites. |

### 3.3 In the product today (scientific detail & verification)

| Resource | Agency / Source | Use in the project |
| :--- | :--- | :--- |
| **MERRA-2** reanalysis (named in the challenge) | NASA GMAO, served by **NASA POWER v10** (NASA Langley), public Zarr store | Annual mean air temperature at 2 m, corrected precipitation, land evaporation and root-zone soil wetness, 1981–2025, regridded from 0.5° × 0.625° to 2°. |
| **GPM IMERG** (GPM is named in the challenge) | NASA GPM, served by **NASA POWER v10** | Annual mean satellite precipitation, 1998–2025, regridded from 0.1° to 2°. Lets users compare a model with a satellite product at the same place. |
| **MODIS** vegetation index (MODIS is named in the challenge) | MODIS on Terra, product MOD13A3 (NASA LP DAAC), served by **NASA GIBS** | Monthly NDVI, March 2000 to December 2025: cell means on the 2° grid, recovered from the GIBS tiles with their official colormap (142 classes, 0.005 to 0.01 wide). |
| **GISTEMP v4** | NASA Goddard Institute for Space Studies | Monthly land–ocean temperature anomaly on a 2° grid, January 2000 to August 2026. |
| **GRACE / GRACE-FO** | NASA Goddard Space Flight Center mascons, RL06v2.0 (Loomis et al., 2019), open download | Monthly water and ice mass on land, April 2002 to December 2025, in cm of water equivalent relative to 2004–2009: 12,896 land and grounded-ice mascons regridded to 5,832 cells of 2°. |
| **OCO-2** column CO₂ | OCO-2 Level 2 Lite (GES DISC), served by **NASA GIBS** | Annual mean XCO₂ per 2° cell, 2015–2025, recovered from the daily GIBS images with their official colormap (0.4 ppm classes): 13.1 million soundings. Rises in every cell with a series, median +2.47 ppm per year. |
| **NASA GIBS, Blue Marble NG, CGI Moon Kit (SVS 4720) & 3D Spacecraft** | NASA EOSDIS / GSFC / Earth Observatory | Day/night textures, real lunar phase map, and Terra, Aqua, GRACE-FO and OCO-2 in orbit. |

### 3.4 Planned or in progress (excluded from submission claims)

| Resource | Owner | Status on 2026-11-14 |
| :--- | :--- | :--- |
| **AppEEARS** | Diego | Tried for MODIS NDVI and discarded: a global monthly point request advanced 1 % in 23 minutes (days per task). NDVI was loaded from NASA GIBS instead. |
| **Giovanni** | Fabriany / Emilse | To compare our series with NASA's; its API needs an Earthdata token. Not done. |
| **Hydrology Time Series** | Fabriany | The "Data Rods" service answers with a GES DISC notice that it is being discontinued. Not usable as probed on 2026-11-14. |
| **KNMI Climate Explorer** | Johan / Emilse | Planned as an external cross-check. Today the statistics are cross-validated against SciPy. |
| **NOAA Climate Data Online** | Emilse / Fabriany | Planned as a station-level check of a grid cell. Not done. |
| **SeaWiFS paper (NTRS 20090042747)** | Johan | Methodological reference to cite. Not yet cited in the product. |
| **CSA: SWOT, RADARSAT Constellation, Geo.ca** | Fabriany / Daniela / Diego | Not integrated. |

**Honest limits:** MERRA-2 is a reanalysis (a model that assimilates observations), not a direct
measurement; its precipitation trends can include effects of changes in the observing system. NASA
POWER marks its IMERG parameter as "reviewing". OCO-2 has no series where clouds leave too few
soundings (central Amazon, Colombia) and none poleward of 60°. The persistence correction halves false
positives but does not remove them. The tool reports what the data show, not the cause.

### How NASA Resources Inspired the Solution
The challenge states that a variable can trend one way in one region and the opposite way in
another. With a global grid from NASA loaded, that is no longer an example to illustrate: the tool
searches the grid and shows it with numbers.

---

## 4. Use of Super Intelligence (SI) Declaration (`Use of Super Intelligence (SI) *`)

In full compliance with **NASA Space Apps Challenge 2026 SI Rules**:
- **How to answer on the portal:** Select the options corresponding to **coding / software engineering / documentation assistance with LLMs and chatbots** (do **not** select "I did not use SI", and do **not** claim SI-generated scientific data or modified NASA branding).
- **SI Tools Utilized:** Google Gemini (via Antigravity IDE), GitHub Copilot, and Anthropic Claude (via Claude Code) were utilized as software-engineering acceleration tools for code architecture and refactoring, ETL scripting helpers, automated unit/E2E test scaffolding, bilingual UI translation (`EN | ES`), debugging, and technical documentation.
- **Compliance with Space Apps Rules:**
  - **Code & Data Acknowledgment:** SI assistance was used for software code, refactoring, and bilingual copy/documentation as acknowledged in project metadata (`docs/obsidian/35-NASA-Space-Apps-Official-Submission-En.md`). No generative SI tool was used to fabricate, extrapolate, or alter NASA scientific observations; all climate series and trend figures come strictly from official NASA datasets and deterministic C# algorithms cross-validated against SciPy 1.18.1.
  - **Zero NASA Branding Modification:** Generated content did not use, contain, or modify any NASA logos, flags, or mission identifiers.
  - **Images, Video & Audio:** All globe/Earth surface textures, lunar textures, and 3D spacecraft meshes derive deterministically from official NASA assets (`docs/obsidian/earth-assets/`). If any external slide illustration or video/audio narration uses SI generation, it must display a visible SI watermark (visual) or state SI generation in descriptive text and metadata (audio).

---

## 5. Project Demonstration — Option A: 7-Slide English Presentation

**Selected Official Demo Option:** **Option A — Presentation: maximum 7 slides (including cover
slide)**, all text in **English**, hosted publicly and verified in incognito mode before submission,
paired with the live application.

| Slide # | Suggested English Title | Key Content & Visual Evidence |
| :---: | :--- | :--- |
| **Slide 1** | **NASA Earth System Trend Detective** | Cover: 6-member team from Neiva (Colombia), live app URL and repository link. |
| **Slide 2** | **The Challenge: Signal vs. Noise** | Why it is hard to pick a variable and prove a trend; the four questions (*what, where, how much, significant*). |
| **Slide 3** | **Three Choices, One Verdict** | Screenshots: the guided briefing, the globe turning to the chosen place, the 45-year ruler, the detective card with the series and the verdict. |
| **Slide 4** | **Real NASA Data, With Provenance** | Nine variables, all real: **MERRA-2** and **GPM IMERG** through NASA POWER, **MODIS NDVI** and **OCO-2 CO₂** through NASA GIBS, **GRACE** mascons from NASA Goddard, **GISTEMP v4**. |
| **Slide 5** | **Scientific Rigor** | Mann-Kendall, Sen's slope with 95 % CI and the t-test; the persistence and false-discovery corrections, with how many cells survive; the SciPy cross-validation. Honest example: Amazon rainfall looked significant ($p = 0.016$) and did not survive ($p = 0.091$). |
| **Slide 6** | **Opposite Trends, Measured** | The case board: Central-West Brazil against Bangladesh, four variables, all significant and opposite; the global table of cells rising and falling. |
| **Slide 7** | **Architecture, Impact & Roadmap** | React + Three.js → .NET 10 → DuckDB with seeds and manifests; classroom use; next: external cross-checks (Giovanni, KNMI) and CSA data. |

### 45-Second Judge Elevator Pitch (English)
> *"Hello judges, we are the NASA Earth System Trend Detective team from Neiva, Colombia. Is it
> raining more or less where you live? And is that change real, or just noise? Our web tool lets a
> student answer that in three choices: a variable, a place and a period. It uses real NASA data —
> the MERRA-2 reanalysis, GPM satellite precipitation and MODIS vegetation, all named in this
> challenge, plus GRACE, OCO-2 and GISTEMP — on an interactive 3D globe. It draws the series and tests it three ways: Mann-Kendall,
> Sen's slope with its confidence interval, and a t-test, cross-validated against SciPy, and then
> checks whether the trend survives year-to-year persistence. And it
> shows the idea at the heart of this challenge with numbers: in Central-West Brazil the air warms
> and the land dries, while in Bangladesh it cools and gets wetter. Same variables, opposite
> directions, all statistically significant even after that correction. Thank you!"*

---

## 6. Official Judging Criteria Alignment

1. **Impact:** no installation, no file handling and no code: a student gets from a question to a
   tested answer in three choices.
2. **Creativity:** the guided briefing drives a live 3D globe, and the "opposite trends" idea of the
   challenge becomes a board computed from the data.
3. **Validity:** three significance methods cross-validated against SciPy, plus corrections for
   serial correlation and multiple testing chosen by simulation; real data with a provenance manifest
   per dataset; limits stated, including a headline example that did not survive our own check.
4. **Relevance:** it follows the four objectives of the challenge and uses three sources the
   challenge names (MERRA-2, GPM and MODIS), plus GRACE, OCO-2 and GISTEMP.
5. **Presentation:** an instrument-style interface, a glossary in plain language, case studies ready
   to open and a focused 7-slide narrative.
