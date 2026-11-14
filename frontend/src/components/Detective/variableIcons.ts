/**
 * Iconografía y acento de cada variable para el asistente y los casos. Sustituye a los emojis: un
 * emoji se dibuja distinto en cada sistema operativo y no respeta la paleta mineral del instrumento.
 */
import type { CSSProperties } from 'react';
import { CloudRain, CloudRainWind, Droplets, Leaf, Snowflake, Sprout, Thermometer, ThermometerSun, Wind, type LucideIcon } from 'lucide-react';
import { SCIENCE_ACCENTS } from '../../config/scienceTheme';
import type { ClimateVariable } from '../../types/climate.types';

export const VARIABLE_ICONS: Record<ClimateVariable, LucideIcon> = {
  Gistemp: Thermometer,
  Merra2Temperature: ThermometerSun,
  Merra2Precipitation: CloudRain,
  GpmPrecipitation: CloudRainWind,
  Merra2Evaporation: Droplets,
  Merra2SoilMoisture: Sprout,
  ModisNdvi: Leaf,
  GraceMass: Snowflake,
  Oco2: Wind,
};

/**
 * Acento de la variable como propiedades CSS. Se calcula una sola vez: crear el objeto dentro de un
 * map obligaría a React a repintar cada fila en cada render.
 */
export const VARIABLE_ACCENT_STYLE = Object.fromEntries(
  Object.entries(SCIENCE_ACCENTS).map(([variable, { accent, rgb }]) => [
    variable, { '--row-accent': accent, '--row-rgb': rgb } as CSSProperties,
  ]),
) as Record<ClimateVariable, CSSProperties>;
