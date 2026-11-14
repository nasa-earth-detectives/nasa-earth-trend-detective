import type { ClimateVariable } from '../../types/climate.types';

/**
 * Variables que tienen un escenario ficticio de demostración. Las de MERRA-2 no lo tienen a
 * propósito: llegaron con datos reales, y sin esos datos no hay nada honesto que dibujar. Para
 * ellas los generadores de demostración devuelven vacío en vez de reutilizar el campo de otra variable.
 */
const DEMO_VARIABLES: readonly ClimateVariable[] = ['Gistemp', 'ModisNdvi', 'GraceMass', 'Oco2'];

export function hasDemoScenario(variable: ClimateVariable): boolean {
  return DEMO_VARIABLES.includes(variable);
}
