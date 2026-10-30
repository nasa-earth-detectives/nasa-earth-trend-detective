/**
 * Utilidad de contexto biofísico y regional para el inspector de detective.
 * Cumple con el criterio de la NASA de contextualizar tendencias regionales según el bioma.
 */
export interface RegionalBiomeInfo {
  biome: string;
  contextNote: string;
}

export function getRegionalBiomeContext(lat: number, lng: number): RegionalBiomeInfo {
  const absLat = Math.abs(lat);

  // Zonas Polares
  if (absLat >= 66.5) {
    return lat > 0
      ? {
          biome: 'Tundra Ártica y Hielo Marino',
          contextNote: 'Zona de amplificación polar y permafrost vulnerable a retroalimentación albedo-hielo.',
        }
      : {
          biome: 'Casquete Glaciar Antártico',
          contextNote: 'Reserva primaria de agua dulce del planeta con dinámicas de balance de masa críticas.',
        };
  }

  // Zonas Tropicales y Ecuatoriales (-23.5° a 23.5°)
  if (absLat <= 23.5) {
    // Amazonía
    if (lat >= -18 && lat <= 8 && lng >= -78 && lng <= -45) {
      return {
        biome: 'Selva Húmeda Tropical Amazónica',
        contextNote: 'Mayor sumidero terrestre de carbono y regulador de la humedad atmosférica intercontinental.',
      };
    }
    // Cuenca del Congo
    if (lat >= -10 && lat <= 8 && lng >= 10 && lng <= 32) {
      return {
        biome: 'Selva Ecuatorial del Congo',
        contextNote: 'Segundo pulmón forestal del planeta con alta densidad de biomasa y resiliencia térmica.',
      };
    }
    // Sahel / Norte de África
    if (lat >= 10 && lat <= 20 && lng >= -18 && lng <= 38) {
      return {
        biome: 'Franja Ecotonal del Sahel',
        contextNote: 'Zona de transición semiárida sensible al desplazamiento meridional del monzón africano.',
      };
    }
    // Sudeste Asiático / Archipiélago Indo-Pacífico
    if (lat >= -10 && lat <= 15 && lng >= 95 && lng <= 145) {
      return {
        biome: 'Bosques Tropicales Indo-Malayos',
        contextNote: 'Intersección marítimo-continental altamente modulada por las oscilaciones de El Niño (ENSO).',
      };
    }
    // Sahara / Península Arábiga
    if (lat >= 18 && lat <= 30 && lng >= -15 && lng <= 55) {
      return {
        biome: 'Desierto Cálido Hiperárido',
        contextNote: 'Región de balance radiativo neto positivo con transporte eólico de aerosoles y polvo mineral.',
      };
    }

    return {
      biome: 'Zona Tropical / Aguas Cálidas',
      contextNote: 'Región de alta insolación superficial y convección atmosférica de la celda de Hadley.',
    };
  }

  // Zonas Templadas y Boreales
  if (lat > 50 && lat < 66.5) {
    return {
      biome: 'Taiga y Bosque Boreal',
      contextNote: 'Franja de almacenamiento masivo de carbono edáfico en suelos boreales y turberas.',
    };
  }

  return {
    biome: 'Zona Templada Continental / Marítima',
    contextNote: 'Zona de fuerte variabilidad estacional modulada por frentes polares y masas de aire marítimas.',
  };
}
