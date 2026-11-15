-- =============================================================================
-- NASA Earth System Trend Detective - Analytical Star Schema (DuckDB)
-- -----------------------------------------------------------------------------
-- Idempotent script: can be executed on every startup without failing or
-- duplicating data (CREATE ... IF NOT EXISTS + INSERT OR IGNORE on primary keys).
--
--   dim_variable ---+
--   dim_time -------+--- fact_climate_observations
--   dim_location ---+
--
-- MANDATORY INSERTION ORDER IN fact_climate_observations:
--   ORDER BY variable_id, year, latitude, longitude
-- DuckDB stores min/max statistics (zonemaps) per row group (~122k rows).
-- If data arrives ordered by (variable_id, year, latitude, longitude),
-- typical filters (one variable, year range, geographic bounding box) skip
-- entire row groups without reading them (data skipping). Unordered inserts
-- negate this benefit: every row group would span the full range and have to be
-- scanned. Therefore NO ART indexes are created: physical ordering is the "index".
-- =============================================================================

-- Climate variable dimension. IDs are aligned with the enum
-- NasaTrendDetective.Domain.Enums.ClimateVariable (Gistemp=1 .. GpmPrecipitation=9).
-- No CHECK on the ID range: the foreign key and seed already bound it, and a CHECK
-- forces rebuilding the database every time a variable is added (see DuckDbSchemaInitializer).
CREATE TABLE IF NOT EXISTS dim_variable (
    variable_id   TINYINT PRIMARY KEY,
    variable_code VARCHAR NOT NULL UNIQUE,
    variable_name VARCHAR NOT NULL,
    unit          VARCHAR NOT NULL,
    mission       VARCHAR NOT NULL
);

-- Time dimension with monthly granularity (natural key year + month).
CREATE TABLE IF NOT EXISTS dim_time (
    year     SMALLINT NOT NULL,
    month    TINYINT  NOT NULL,
    decade   SMALLINT NOT NULL,
    quarter  TINYINT  NOT NULL,
    season   VARCHAR  NOT NULL, -- Boreal meteorological season: DJF, MAM, JJA, SON
    first_day DATE    NOT NULL,
    PRIMARY KEY (year, month),
    CHECK (month BETWEEN 1 AND 12)
);

-- Spatial dimension: grid cell with lat/lng rounded to 3 decimal places.
-- Populated during ingestion (INSERT OR IGNORE) with observed cells.
CREATE TABLE IF NOT EXISTS dim_location (
    latitude   DECIMAL(6,3) NOT NULL,
    longitude  DECIMAL(6,3) NOT NULL,
    hemisphere VARCHAR      NOT NULL, -- 'N' or 'S'
    lat_band   SMALLINT     NOT NULL, -- 10-degree band: floor(latitude / 10) * 10
    PRIMARY KEY (latitude, longitude),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

-- Fact table: one row per observation (variable, cell, year, month).
-- Only variable_id declares a FOREIGN KEY (small dimension, zero cost).
-- (year, month) and (latitude, longitude) logically reference dim_time and
-- dim_location without a declared FK to avoid penalizing bulk ingestion.
-- Reminder: insert ORDER BY variable_id, year, latitude, longitude (see header).
CREATE TABLE IF NOT EXISTS fact_climate_observations (
    observation_id    BIGINT PRIMARY KEY,
    variable_id       TINYINT      NOT NULL REFERENCES dim_variable (variable_id),
    latitude          DECIMAL(6,3) NOT NULL,
    longitude         DECIMAL(6,3) NOT NULL,
    year              SMALLINT     NOT NULL,
    month             TINYINT      NOT NULL,
    observation_value DOUBLE,
    anomaly_value     DOUBLE,
    CHECK (month BETWEEN 1 AND 12)
);

-- Dataset provenance loaded per variable (one row per variable). No row = no real
-- data: the API declares the variable as "synthetic" instead of inventing observations.
-- parquet_sha256 identifies the imported file: if unchanged, startup re-imports nothing;
-- if changed (new source or new download), facts for that variable are replaced.
CREATE TABLE IF NOT EXISTS dataset_provenance (
    variable_id        TINYINT     PRIMARY KEY REFERENCES dim_variable (variable_id),
    provider           VARCHAR     NOT NULL,
    product            VARCHAR     NOT NULL,
    unit               VARCHAR     NOT NULL,
    trend_unit         VARCHAR     NOT NULL,
    baseline           VARCHAR,
    resolution_degrees DOUBLE      NOT NULL,
    source_url         VARCHAR     NOT NULL,
    source_file        VARCHAR     NOT NULL,
    source_sha256      VARCHAR     NOT NULL,
    retrieved_at       TIMESTAMP   NOT NULL, -- UTC
    coverage_start     SMALLINT    NOT NULL,
    coverage_end       SMALLINT    NOT NULL,
    last_month         VARCHAR     NOT NULL,
    interim            BOOLEAN     NOT NULL,
    citation           VARCHAR     NOT NULL,
    parquet_file       VARCHAR     NOT NULL,
    parquet_sha256     VARCHAR     NOT NULL,
    row_count          BIGINT      NOT NULL,
    loaded_at          TIMESTAMP   NOT NULL  -- UTC
);

-- Seed dim_variable (idempotent).
INSERT OR IGNORE INTO dim_variable (variable_id, variable_code, variable_name, unit, mission) VALUES
    (1, 'Gistemp',   'Global surface temperature anomaly',        'degC',     'NASA GISS GISTEMP v4'),
    (2, 'ModisNdvi', 'NDVI vegetation index',                     'NDVI',     'Terra/Aqua MODIS'),
    (3, 'GraceMass', 'Equivalent water mass anomaly',             'cm',       'GRACE/GRACE-FO'),
    (4, 'Oco2',      'Columnar CO2 concentration (XCO2)',         'ppm',      'OCO-2'),
    (5, 'Merra2Temperature',   'Air temperature at 2 m',          'degC',     'MERRA-2 (NASA POWER)'),
    (6, 'Merra2Precipitation', 'Total bias-corrected precipitation', 'mm/day', 'MERRA-2 (NASA POWER)'),
    (7, 'Merra2Evaporation',   'Land evaporation',                'mm/day',   'MERRA-2 (NASA POWER)'),
    (8, 'Merra2SoilMoisture',  'Root zone soil moisture',         'fraction', 'MERRA-2 (NASA POWER)'),
    (9, 'GpmPrecipitation',    'Satellite-estimated precipitation', 'mm/day', 'GPM IMERG (NASA POWER)');

-- Annual value per cell, derived from fact_climate_observations when a dataset is loaded
-- (see Etl/AnnualCellTable.cs). Trend grids read it instead of reducing months to years on every
-- request: for GISTEMP that reduction covers 5.1 million facts and ran DuckDB out of its memory limit
-- on the 512 MB host. month_count is the number of months behind each average.
CREATE TABLE IF NOT EXISTS fact_annual_cell (
    variable_id     TINYINT      NOT NULL,
    latitude        DECIMAL(6,3) NOT NULL,
    longitude       DECIMAL(6,3) NOT NULL,
    year            SMALLINT     NOT NULL,
    average_value   DOUBLE,
    average_anomaly DOUBLE,
    month_count     SMALLINT     NOT NULL
);

-- Seed dim_time: months from 1880 (GISTEMP start) to 2100 (idempotent).
INSERT OR IGNORE INTO dim_time (year, month, decade, quarter, season, first_day)
SELECT
    CAST(y AS SMALLINT),
    CAST(m AS TINYINT),
    CAST((y // 10) * 10 AS SMALLINT),
    CAST((m - 1) // 3 + 1 AS TINYINT),
    CASE WHEN m IN (12, 1, 2) THEN 'DJF'
         WHEN m IN (3, 4, 5)  THEN 'MAM'
         WHEN m IN (6, 7, 8)  THEN 'JJA'
         ELSE 'SON' END,
    make_date(CAST(y AS BIGINT), CAST(m AS BIGINT), 1)
FROM range(1880, 2101) AS years(y)
CROSS JOIN range(1, 13) AS months(m);
