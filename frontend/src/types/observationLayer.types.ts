/** Alternative visual representations of the same annual observation dataset. */
export type ObservationLayerMode = 'hex' | 'heat' | 'none';
export type ObservationCoverage = 'land' | 'global';
export type ObservationSource = 'demo' | 'api';

/**
 * Inquiry answered by the globe.
 * - `annual`: variable value for the selected year.
 * - `trend`: rate of change (Sen's slope) over the entire period.
 */
export type GlobeReading = 'annual' | 'trend';
