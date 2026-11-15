import type { ClimateVariable } from '../../types/climate.types';

/**
 * Variables that have a synthetic demo scenario. MERRA-2 variables intentionally do not:
 * they arrived with real data, and without that data there is nothing honest to render. For
 * them, demo generators return empty instead of reusing another variable's field.
 */
const DEMO_VARIABLES: readonly ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];

export function hasDemoScenario(variable: ClimateVariable): boolean {
  return DEMO_VARIABLES.includes(variable);
}
