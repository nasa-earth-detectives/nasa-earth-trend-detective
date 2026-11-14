/**
 * Opciones del asistente "Detective de Tendencias": regiones de partida y periodos de análisis.
 * Viven aparte del glosario para que ninguno de los dos archivos supere el límite de líneas de la CI.
 */
import type { ClimateVariable } from '../types/climate.types';
import { EARLIEST_RECORD_YEAR } from './climateLayers';

/** Región predefinida: el jurado puede elegirla sin tener que hacer clic en el globo. */
export interface WizardRegion {
  id: string;
  label: string;
  description: string;
  lat: number;
  lng: number;
  suggestedVariables: ClimateVariable[];
}

// Las variables sugeridas son las que tienen datos reales (GISTEMP y MERRA-2): sugerir una de
// demostración llevaría al estudiante a un escenario ficticio sin que lo haya pedido.
export const WIZARD_REGIONS: WizardRegion[] = [
  {
    id: 'arctic',
    label: 'Ártico',
    description: 'Zona de calentamiento más rápido del planeta',
    lat: 78,
    lng: 15,
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'amazon',
    label: 'Amazonía',
    description: 'El pulmón verde más grande de la Tierra',
    lat: -5,
    lng: -60,
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2Temperature'],
  },
  {
    id: 'sahara',
    label: 'Sahara',
    description: 'El mayor desierto cálido del planeta',
    lat: 23,
    lng: 15,
    suggestedVariables: ['Merra2Temperature', 'Merra2SoilMoisture'],
  },
  {
    id: 'greenland',
    label: 'Groenlandia',
    description: 'El mayor reservorio de hielo del hemisferio norte',
    lat: 72,
    lng: -40,
    suggestedVariables: ['Gistemp', 'Merra2Temperature'],
  },
  {
    id: 'southasia',
    label: 'Asia del Sur',
    description: 'Una de las regiones agrícolas más pobladas del mundo',
    lat: 25,
    lng: 80,
    suggestedVariables: ['Merra2Precipitation', 'ModisNdvi', 'Merra2SoilMoisture'],
  },
  {
    id: 'custom',
    label: 'Elegir en el globo',
    description: 'Toca cualquier punto del globo para seleccionarlo',
    lat: 0,
    lng: 0,
    suggestedVariables: ['Gistemp'],
  },
];

/** Periodo representativo para el análisis de tendencia. */
export interface WizardPeriod {
  id: string;
  label: string;
  description: string;
  startYear: number;
  endYear: number;
}

const THIS_YEAR = new Date().getUTCFullYear();

// "Todo el registro" va primero y es la opción inicial: el reto pide una serie lo bastante larga
// para el análisis estadístico. El periodo se recorta después a la cobertura real de cada fuente.
export const WIZARD_PERIODS: WizardPeriod[] = [
  {
    id: 'max',
    label: 'Todo el registro',
    description: 'Desde 1981 con MERRA-2 y desde 2000 con GISTEMP · La serie más larga',
    startYear: EARLIEST_RECORD_YEAR,
    endYear: THIS_YEAR,
  },
  {
    id: '25y',
    label: 'Desde 2000',
    description: '2000 → hoy · Suficiente para detectar tendencias claras',
    startYear: 2000,
    endYear: THIS_YEAR,
  },
  {
    id: '15y',
    label: 'Desde 2010',
    description: '2010 → hoy · Tendencias recientes',
    startYear: 2010,
    endYear: THIS_YEAR,
  },
  {
    id: '10y',
    label: 'Desde 2015',
    description: '2015 → hoy · Cambios de la última década',
    startYear: 2015,
    endYear: THIS_YEAR,
  },
];
