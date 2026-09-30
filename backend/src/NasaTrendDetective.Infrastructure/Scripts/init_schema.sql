-- =============================================================================
-- NASA Earth System Trend Detective - Esquema estrella analitico (DuckDB)
-- -----------------------------------------------------------------------------
-- Script idempotente: puede ejecutarse en cada arranque sin fallar ni duplicar
-- datos (CREATE ... IF NOT EXISTS + INSERT OR IGNORE sobre claves primarias).
--
--   dim_variable ---+
--   dim_time -------+--- fact_climate_observations
--   dim_location ---+
--
-- ORDEN DE INSERCION OBLIGATORIO EN fact_climate_observations:
--   ORDER BY variable_id, year, latitude, longitude
-- DuckDB guarda estadisticas min/max (zonemaps) por row group (~122k filas).
-- Si los datos llegan ordenados por (variable_id, year, latitude, longitude),
-- los filtros tipicos (una variable, rango de anios, caja geografica) descartan
-- row groups completos sin leerlos (data skipping). Insertar desordenado anula
-- esa ventaja: cada row group cubriria todo el rango y habria que escanearlo.
-- Por eso NO se crean indices ART: el ordenamiento fisico es el "indice".
-- =============================================================================

-- Dimension de variables climaticas. Los ids estan alineados con el enum
-- NasaTrendDetective.Domain.Enums.ClimateVariable (Gistemp=1 .. Oco2=4).
CREATE TABLE IF NOT EXISTS dim_variable (
    variable_id   TINYINT PRIMARY KEY,
    variable_code VARCHAR NOT NULL UNIQUE,
    variable_name VARCHAR NOT NULL,
    unit          VARCHAR NOT NULL,
    mission       VARCHAR NOT NULL,
    CHECK (variable_id BETWEEN 1 AND 4)
);

-- Dimension temporal con granularidad mensual (clave natural year + month).
CREATE TABLE IF NOT EXISTS dim_time (
    year     SMALLINT NOT NULL,
    month    TINYINT  NOT NULL,
    decade   SMALLINT NOT NULL,
    quarter  TINYINT  NOT NULL,
    season   VARCHAR  NOT NULL, -- Estacion meteorologica boreal: DJF, MAM, JJA, SON
    first_day DATE    NOT NULL,
    PRIMARY KEY (year, month),
    CHECK (month BETWEEN 1 AND 12)
);

-- Dimension espacial: celda de la grilla con lat/lng redondeados a 3 decimales.
-- Se llena durante la ingesta (INSERT OR IGNORE) con las celdas observadas.
CREATE TABLE IF NOT EXISTS dim_location (
    latitude   DECIMAL(6,3) NOT NULL,
    longitude  DECIMAL(6,3) NOT NULL,
    hemisphere VARCHAR      NOT NULL, -- 'N' o 'S'
    lat_band   SMALLINT     NOT NULL, -- Banda de 10 grados: floor(latitude / 10) * 10
    PRIMARY KEY (latitude, longitude),
    CHECK (latitude BETWEEN -90 AND 90),
    CHECK (longitude BETWEEN -180 AND 180)
);

-- Tabla de hechos: una fila por observacion (variable, celda, anio, mes).
-- Solo variable_id declara FOREIGN KEY (dimension de 4 filas, costo nulo).
-- (year, month) y (latitude, longitude) referencian logicamente a dim_time y
-- dim_location sin FK declarada para no penalizar la ingesta masiva. Recordatorio: insertar ORDER BY variable_id, year,
-- latitude, longitude (ver cabecera).
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

-- Seed de dim_variable (idempotente).
INSERT OR IGNORE INTO dim_variable (variable_id, variable_code, variable_name, unit, mission) VALUES
    (1, 'Gistemp',   'Anomalia de temperatura superficial global', 'degC',  'NASA GISS GISTEMP v4'),
    (2, 'ModisNdvi', 'Indice de vegetacion NDVI',                   'NDVI',  'Terra/Aqua MODIS'),
    (3, 'GraceMass', 'Anomalia de masa de agua equivalente',        'cm',    'GRACE/GRACE-FO'),
    (4, 'Oco2',      'Concentracion columnar de CO2 (XCO2)',        'ppm',   'OCO-2');

-- Seed de dim_time: meses de 1880 (inicio de GISTEMP) a 2100 (idempotente).
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
