/**
 * Biophysical and regional context utility for the Detective Inspector.
 * Fulfills NASA criteria for contextualizing regional trends by biome.
 */
export interface RegionalBiomeInfo {
  biome: string;
  contextNote: string;
}

export function getRegionalBiomeContext(lat: number, lng: number): RegionalBiomeInfo {
  const absLat = Math.abs(lat);

  // Polar Zones
  if (absLat >= 66.5) {
    return lat > 0
      ? {
          biome: 'Arctic Tundra & Sea Ice',
          contextNote: 'Polar amplification zone and permafrost vulnerable to ice-albedo feedback.',
        }
      : {
          biome: 'Antarctic Ice Sheet',
          contextNote: 'Planet’s primary freshwater reservoir with critical mass-balance dynamics.',
        };
  }

  // Tropical and Equatorial Zones (-23.5° to 23.5°)
  if (absLat <= 23.5) {
    // Amazon Basin
    if (lat >= -18 && lat <= 8 && lng >= -78 && lng <= -45) {
      return {
        biome: 'Amazon Tropical Rainforest',
        contextNote: 'Largest terrestrial carbon sink and regulator of intercontinental atmospheric moisture.',
      };
    }
    // Congo Basin
    if (lat >= -10 && lat <= 8 && lng >= 10 && lng <= 32) {
      return {
        biome: 'Congo Equatorial Rainforest',
        contextNote: 'Earth’s second forest lung with high biomass density and thermal resilience.',
      };
    }
    // Sahel / North Africa
    if (lat >= 10 && lat <= 20 && lng >= -18 && lng <= 38) {
      return {
        biome: 'Sahel Ecotone Belt',
        contextNote: 'Semi-arid transition zone sensitive to the meridional shift of the African monsoon.',
      };
    }
    // Southeast Asia / Indo-Pacific Archipelago
    if (lat >= -10 && lat <= 15 && lng >= 95 && lng <= 145) {
      return {
        biome: 'Indo-Malayan Tropical Forests',
        contextNote: 'Maritime-continental intersection strongly modulated by El Niño (ENSO) oscillations.',
      };
    }
    // Sahara / Arabian Peninsula
    if (lat >= 18 && lat <= 30 && lng >= -15 && lng <= 55) {
      return {
        biome: 'Hyper-Arid Warm Desert',
        contextNote: 'Region of positive net radiative balance with wind-driven transport of aerosols and mineral dust.',
      };
    }

    return {
      biome: 'Tropical Zone / Warm Waters',
      contextNote: 'Region of high surface insolation and Hadley cell atmospheric convection.',
    };
  }

  // Temperate and Boreal Zones
  if (lat > 50 && lat < 66.5) {
    return {
      biome: 'Taiga & Boreal Forest',
      contextNote: 'Belt of massive soil carbon storage in boreal soils and peatlands.',
    };
  }

  return {
    biome: 'Continental / Maritime Temperate Zone',
    contextNote: 'Zone of strong seasonal variability modulated by polar fronts and maritime air masses.',
  };
}
