-- =============================================================================
-- NASA Earth System Trend Detective - Analytical star schema (DuckDB)
-- -----------------------------------------------------------------------------
-- Idempotent script: can be run on every startup without failing or duplicating
-- data (CREATE ... IF NOT EXISTS + INSERT OR IGNORE on primary keys).
--
--   dim_variable ---+
--   dim_time -------+--- fact_climate_observations
--   dim_location ---+
--
-- MANDATORY INSERTION ORDER IN fact_climate_observations:
--   ORDER BY variable_id, year, latitude, longitude
-- DuckDB maintains min/max statistics (zonemaps) per row group (~122k rows).
-- When data is sorted by (variable_id, year, latitude, longitude),
-- typical query filters (single variable, year range, geographic bounding box) skip
-- entire row groups without reading them (data skipping). Unordered insertion destroys
-- this optimization: every row group spans the entire range, requiring full scans.
-- For this reason, ART indices are NOT created: physical ordering serves as the index.
-- =============================================================================

-- Climate variable dimension. IDs align with the
-- NasaTrendDetective.Domain.Enums.ClimateVariable enum (Gistemp=1 .. Oco2=4).
CREATE TABLE IF NOT EXISTS dim_variable (
    variable_id   TINYINT PRIMARY KEY,
    variable_code VARCHAR NOT NULL UNIQUE,
    variable_name VARCHAR NOT NULL,
    unit          VARCHAR NOT NULL,
    mission       VARCHAR NOT NULL,
    CHECK (variable_id BETWEEN 1 AND 4)
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
    lat_band   SMALLINT     NOT NULL, -- 10-degree latitude band: floor(latitude / 10) * 10
    PRIMARY KEY (latitude, longitude),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

-- Fact table: one row per observation (variable, cell, year, month).
-- Only variable_id declares a FOREIGN KEY (4-row dimension, negligible overhead).
-- (year, month) and (latitude, longitude) logically reference dim_time and
-- dim_location without declared FKs to avoid bulk ingestion penalties.
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

-- Loaded dataset provenance per variable (one row per variable). Absence of a row = no real
-- data: the API declares the variable as "synthetic" rather than inventing observations.
-- parquet_sha256 identifies the imported file: if unchanged, startup skips re-import;
-- if changed (new data source or download), facts for that variable are replaced.
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
    (1, 'Gistemp',   'Global surface temperature anomaly',       'degC',  'NASA GISS GISTEMP v4'),
    (2, 'ModisNdvi', 'NDVI vegetation index',                    'NDVI',  'Terra/Aqua MODIS'),
    (3, 'GraceMass', 'Equivalent water thickness anomaly',        'cm',    'GRACE/GRACE-FO'),
    (4, 'Oco2',      'Column-averaged CO2 concentration (XCO2)', 'ppm',   'OCO-2');

-- Seed dim_time: months from 1880 (start of GISTEMP) to 2100 (idempotent).
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
