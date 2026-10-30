/** Representaciones alternativas del mismo conjunto anual de observaciones. */
export type ObservationLayerMode = 'hex' | 'heat' | 'none';
export type ObservationCoverage = 'land' | 'global';
export type ObservationSource = 'demo' | 'api';

/**
 * Pregunta que responde el globo.
 * - `annual`: valor de la variable en el año elegido.
 * - `trend`: ritmo de cambio (pendiente de Sen) en todo el periodo.
 */
export type GlobeReading = 'annual' | 'trend';
