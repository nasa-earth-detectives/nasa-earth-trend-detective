/**
 * Iconography and accent for each variable in the wizard and cases. Replaces emojis: an
 * emoji renders differently across operating systems and does not follow the instrument’s mineral palette.
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
 * Variable accent as CSS custom properties. Computed once: creating the object inside a
 * map would force React to repaint every row on each render.
 */
export const VARIABLE_ACCENT_STYLE = Object.fromEntries(
  Object.entries(SCIENCE_ACCENTS).map(([variable, { accent, rgb }]) => [
    variable, { '--row-accent': accent, '--row-rgb': rgb } as CSSProperties,
  ]),
) as Record<ClimateVariable, CSSProperties>;
