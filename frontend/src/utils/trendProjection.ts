import type { TimeSeriesDataPoint } from '../types/detective.types';

export interface ProjectedValue {
  year: number;
  value: number;
  /** Ends of the range a yearly value would fall in 95 times out of 100 if the trend went on unchanged. */
  low: number;
  high: number;
}

/** Round years offered as targets. */
const TARGET_YEARS = [2027, 2030, 2035, 2040, 2050];
/** Below this many years a straight line says too little to be carried forward. */
const MIN_YEARS = 10;

/** Intercept of the Theil-Sen line: the median of what is left of each value after removing the slope. */
export function senIntercept(series: TimeSeriesDataPoint[], slope: number): number {
  const rest = series.map(point => point.value - slope * point.year).sort((a, b) => a - b);
  const middle = Math.floor(rest.length / 2);
  return rest.length % 2 === 1 ? rest[middle] : (rest[middle - 1] + rest[middle]) / 2;
}

/** 97.5 % quantile of Student's t (Cornish-Fisher expansion): 2.306 for 8 degrees of freedom, as in the tables. */
function studentQuantile(degrees: number): number {
  const z = 1.959964;
  return z + (z ** 3 + z) / (4 * degrees) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * degrees ** 2)
    + (3 * z ** 7 + 19 * z ** 5 + 17 * z ** 3 - 15 * z) / (384 * degrees ** 3);
}

/**
 * Target years worth showing for a series: after its last year and no further ahead than half its
 * span. A 45-year record is carried up to 22 years forward; an 11-year one, 5.
 */
export function projectionYears(series: TimeSeriesDataPoint[]): number[] {
  if (series.length < MIN_YEARS) return [];
  const years = series.map(point => point.year);
  const last = Math.max(...years);
  const reach = Math.floor((last - Math.min(...years) + 1) / 2);
  return TARGET_YEARS.filter(year => year > last && year - last <= reach);
}

/**
 * Where the series would be in each of `years` if its trend went on unchanged: the Theil-Sen line
 * carried forward, with the range a new yearly value would fall in 95 % of the time. The range adds
 * the scatter of the years around the line to the uncertainty of the line itself, which grows with the
 * distance, as in the prediction interval of a straight-line fit.
 *
 * It is an extrapolation of the record, not a climate model: it knows nothing about emissions, El
 * Niño or anything that has not already happened in the years analysed.
 */
export function projectTrend(series: TimeSeriesDataPoint[], slope: number, years: number[]): ProjectedValue[] {
  const count = series.length;
  if (count < MIN_YEARS || !Number.isFinite(slope)) return [];
  const intercept = senIntercept(series, slope);
  const meanYear = series.reduce((sum, point) => sum + point.year, 0) / count;
  const spreadOfYears = series.reduce((sum, point) => sum + (point.year - meanYear) ** 2, 0);
  if (spreadOfYears === 0) return [];
  const squares = series.reduce((sum, point) => sum + (point.value - intercept - slope * point.year) ** 2, 0);
  const scatter = Math.sqrt(squares / (count - 2));
  const quantile = studentQuantile(count - 2);
  return years.map(year => {
    const value = intercept + slope * year;
    const half = quantile * scatter * Math.sqrt(1 + 1 / count + (year - meanYear) ** 2 / spreadOfYears);
    return { year, value, low: value - half, high: value + half };
  });
}

/** The outlook of a series: every year up to the furthest target, for the chart, and the targets listed under it. */
export function trendOutlook(series: TimeSeriesDataPoint[], slope: number): { path: ProjectedValue[]; listed: ProjectedValue[] } {
  const years = projectionYears(series);
  const path = years.length > 0 ? projectionPath(series, slope, years[years.length - 1]) : [];
  const targets = new Set(years);
  return { path, listed: path.filter(item => targets.has(item.year)) };
}

/** Every year from the last of the series to `until`: the band a chart draws after the observations. */
export function projectionPath(series: TimeSeriesDataPoint[], slope: number, until: number): ProjectedValue[] {
  if (series.length === 0) return [];
  const last = Math.max(...series.map(point => point.year));
  if (until <= last) return [];
  return projectTrend(series, slope, Array.from({ length: until - last + 1 }, (_, index) => last + index));
}
