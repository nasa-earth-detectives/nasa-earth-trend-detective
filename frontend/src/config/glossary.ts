/**
 * glossary.ts
 *
 * Glosario de variables climáticas en lenguaje accesible para estudiantes
 * de secundaria y público general (audiencia objetivo NASA Space Apps 2026).
 *
 * Cada entrada define:
 *  - `tagline`    : frase corta de gancho (≤ 8 palabras)
 *  - `plain`      : definición en lenguaje cotidiano (1-2 oraciones)
 *  - `whyMatters` : por qué importa detectar esta tendencia
 *  - `askAbout`   : pregunta que inspira al "detective" a investigar
 *  - `exampleRegion` : región emblemática con tendencia conocida
 *  - `unit`       : unidad en lenguaje cotidiano
 */

import type { ClimateVariable } from '../types/climate.types';

export interface GlossaryEntry {
  tagline: string;
  plain: string;
  whyMatters: string;
  askAbout: string;
  exampleRegion: { label: string; lat: number; lng: number };
  unit: string;
}

export const VARIABLE_GLOSSARY: Record<ClimateVariable, GlossaryEntry> = {
  Gistemp: {
    tagline: '¿Está la Tierra más caliente que antes?',
    plain:
      'No es la temperatura del día de hoy. Es qué tan diferente está el planeta comparado con el promedio del siglo XX. Un valor positivo significa más calor; negativo, más frío.',
    whyMatters:
      'Cuando la temperatura sube de forma constante año tras año, eso afecta los glaciares, el nivel del mar, las cosechas y los patrones climáticos. Detectar dónde ocurre más rápido ayuda a entender qué zonas del planeta cambian más.',
    askAbout:
      '¿Está calentando el Ártico más rápido que el resto del planeta?',
    exampleRegion: { label: 'Ártico (Svalbard)', lat: 78, lng: 15 },
    unit: 'grados Celsius de diferencia respecto al siglo pasado',
  },
  Merra2Temperature: {
    tagline: '¿Hace más calor en el aire que respiramos?',
    plain:
      'Es la temperatura del aire a dos metros del suelo, promediada en todo el año. La calcula MERRA-2, un modelo de la NASA que combina satélites, globos y estaciones. Aquí se muestra como diferencia respecto al promedio de 1991 a 2020.',
    whyMatters:
      'Es la temperatura que sienten las personas, los cultivos y los animales. Cambios pequeños pero sostenidos afectan a las cosechas, al hielo y a la demanda de agua.',
    askAbout:
      '¿En qué lugares sube la temperatura del aire y en cuáles baja?',
    exampleRegion: { label: 'Amazonía central', lat: -3, lng: -61 },
    unit: 'grados Celsius de diferencia respecto a 1991–2020',
  },
  Merra2Precipitation: {
    tagline: '¿Llueve más o menos que antes?',
    plain:
      'Es la lluvia y la nieve que caen en promedio cada día del año, en milímetros. Un milímetro equivale a un litro de agua por metro cuadrado. Los valores vienen de MERRA-2, el modelo de la NASA.',
    whyMatters:
      'De la lluvia dependen los ríos, los cultivos y el agua potable. La misma variable puede subir en una región y bajar en otra: por eso hay que mirar lugar por lugar.',
    askAbout:
      '¿Dónde llueve cada vez más y dónde cada vez menos?',
    exampleRegion: { label: 'Sahel central', lat: 15, lng: 5 },
    unit: 'milímetros de agua por día, como diferencia respecto a 1991–2020',
  },
  GpmPrecipitation: {
    tagline: '¿Qué lluvia ven los satélites?',
    plain:
      'Es la lluvia y la nieve estimadas desde el espacio por la misión GPM, que combina las mediciones de varios satélites en un producto llamado IMERG. Se da en milímetros por día, promediados en el año, desde 1998.',
    whyMatters:
      'Es una medición hecha desde satélites, no un modelo. Compararla con la precipitación de MERRA-2 en el mismo lugar enseña si dos fuentes distintas cuentan la misma historia.',
    askAbout:
      '¿El satélite y el modelo ven la misma tendencia en este lugar?',
    exampleRegion: { label: 'Bangladés oriental', lat: 23, lng: 91 },
    unit: 'milímetros de agua por día, como diferencia respecto a 2001–2020',
  },
  Merra2Evaporation: {
    tagline: '¿Cuánta agua se va del suelo al aire?',
    plain:
      'La evaporación es el agua que pasa del suelo y de las plantas al aire. Se mide en milímetros por día, igual que la lluvia, y aquí sólo existe sobre tierra firme.',
    whyMatters:
      'Si se evapora más agua de la que llueve, el suelo se seca. Comparar evaporación y lluvia en un mismo lugar ayuda a entender si esa región gana o pierde agua.',
    askAbout:
      '¿La evaporación cambia en el mismo sentido que la lluvia?',
    exampleRegion: { label: 'Llanura del Ganges', lat: 25, lng: 81 },
    unit: 'milímetros de agua por día, como diferencia respecto a 1991–2020',
  },
  Merra2SoilMoisture: {
    tagline: '¿Tiene el suelo agua para las plantas?',
    plain:
      'Indica cuánta agua hay en la capa de suelo donde crecen las raíces. Va de 0 (completamente seco) a 1 (saturado de agua) y sólo existe sobre tierra firme.',
    whyMatters:
      'Con poca humedad en el suelo las plantas sufren aunque llueva un poco. Es una señal temprana de sequía y afecta directamente a la agricultura.',
    askAbout:
      '¿Hay regiones donde el suelo se seca año tras año?',
    exampleRegion: { label: 'Península ibérica', lat: 39, lng: -3 },
    unit: 'fracción de 0 a 1, como diferencia respecto a 1991–2020',
  },
  ModisNdvi: {
    tagline: '¿Están los bosques creciendo o desapareciendo?',
    plain:
      'El NDVI mide qué tan verde está una zona. Va de 0 (suelo desnudo) a 1 (selva densa). El instrumento MODIS, a bordo del satélite Terra, lo obtiene mirando cómo las plantas reflejan la luz.',
    whyMatters:
      'Los bosques absorben CO₂ y regulan el agua. Cuando el NDVI baja en una región, puede significar deforestación, sequía o incendios. Cuando sube, puede indicar reforestación o más lluvia.',
    askAbout:
      '¿Está la Amazonía perdiendo vegetación año tras año?',
    exampleRegion: { label: 'Amazonía central', lat: -5, lng: -60 },
    unit: 'índice sin unidad (de 0 a 1, mayor = más vegetación)',
  },
  GraceMass: {
    tagline: '¿Cuánta agua y hielo está desapareciendo?',
    plain:
      'Los satélites GRACE y GRACE-FO detectan cambios en la gravedad de la Tierra para medir si hay más o menos agua o hielo bajo tierra o en los glaciares. Es como una balanza gigante en el espacio.',
    whyMatters:
      'Groenlandia y la Antártida están perdiendo hielo. Esa agua llega al mar y sube el nivel de los océanos. También detecta sequías profundas cuando los acuíferos se agotan.',
    askAbout:
      '¿Groenlandia está perdiendo hielo cada año?',
    // El interior de Groenlandia casi no cambia (medido: +0,37 cm/año, p = 0,08); la pérdida está en la costa.
    exampleRegion: { label: 'Sureste de Groenlandia', lat: 69, lng: -33 },
    unit: 'centímetros equivalentes de agua (más negativo = menos masa)',
  },
  Oco2: {
    tagline: '¿Hay más CO₂ en el aire que antes?',
    plain:
      'El satélite OCO-2 mide cuánto dióxido de carbono hay en una columna de aire sobre cada punto de la Tierra. Es el gas que más contribuye al efecto invernadero.',
    // Medido en los datos cargados (2015-2025): sube en las 3.139 celdas con serie, entre 2,30 y 2,70 ppm
    // por año. La diferencia entre regiones es pequeña: el satélite ve la mezcla, no la chimenea.
    whyMatters:
      'Las fábricas, los autos y la deforestación emiten CO₂, y el aire lo reparte por todo el planeta. Por eso sube casi al mismo ritmo en todas partes, también en mitad del océano: unas 2,5 partes por millón cada año.',
    askAbout:
      '¿Sube el CO₂ también lejos de las ciudades, en mitad del Pacífico?',
    exampleRegion: { label: 'Hawái, junto al observatorio de Mauna Loa', lat: 19, lng: -155 },
    unit: 'partes por millón en el aire (ppm)',
  },
};
