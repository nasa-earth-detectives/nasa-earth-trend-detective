import type { GlobeInstance } from 'globe.gl';

export interface RadarHotspotRing {
  id: string;
  name: string;
  lat: number;
  lng: number;
  maxRadius: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: (t: number) => string;
}

export const CLIMATE_RADAR_HOTSPOTS: RadarHotspotRing[] = [
  {
    id: 'hotspot-arctic',
    name: 'Ártico (Svalbard) — Alerta Térmica',
    lat: 78.22,
    lng: 15.63,
    maxRadius: 7.5,
    propagationSpeed: 2.2,
    repeatPeriod: 1200,
    color: t => `rgba(255, 60, 60, ${Math.max(0, 1 - t)})`,
  },
  {
    id: 'hotspot-subpolar',
    name: 'Giro Subpolar — Anomalía AMOC',
    lat: 55.0,
    lng: -30.0,
    maxRadius: 6.0,
    propagationSpeed: 1.8,
    repeatPeriod: 1500,
    color: t => `rgba(0, 200, 255, ${Math.max(0, 1 - t)})`,
  },
  {
    id: 'hotspot-amazon',
    name: 'Cuenca Amazónica — Estrés Hídrico',
    lat: -3.46,
    lng: -62.21,
    maxRadius: 6.8,
    propagationSpeed: 2.0,
    repeatPeriod: 1400,
    color: t => `rgba(255, 180, 0, ${Math.max(0, 1 - t)})`,
  },
  {
    id: 'hotspot-greenland',
    name: 'Groenlandia — Pérdida Glaciar GRACE',
    lat: 72.0,
    lng: -40.0,
    maxRadius: 8.0,
    propagationSpeed: 2.5,
    repeatPeriod: 1300,
    color: t => `rgba(200, 80, 255, ${Math.max(0, 1 - t)})`,
  },
  {
    id: 'hotspot-china',
    name: 'Sur de China — Reverdecimiento MODIS',
    lat: 25.0,
    lng: 115.0,
    maxRadius: 5.5,
    propagationSpeed: 1.9,
    repeatPeriod: 1600,
    color: t => `rgba(0, 255, 128, ${Math.max(0, 1 - t)})`,
  },
];

export function createEarthRadarRipples(globe: GlobeInstance) {
  let visible = true;
  let rings = CLIMATE_RADAR_HOTSPOTS;

  const applyToGlobe = () => {
    globe
      .ringsData(visible ? rings : [])
      .ringLat((d: object) => (d as RadarHotspotRing).lat)
      .ringLng((d: object) => (d as RadarHotspotRing).lng)
      .ringColor((d: object) => (d as RadarHotspotRing).color)
      .ringMaxRadius((d: object) => (d as RadarHotspotRing).maxRadius)
      .ringPropagationSpeed((d: object) => (d as RadarHotspotRing).propagationSpeed)
      .ringRepeatPeriod((d: object) => (d as RadarHotspotRing).repeatPeriod);
  };

  applyToGlobe();

  return {
    setVisible(nextVisible: boolean) {
      if (visible === nextVisible) return;
      visible = nextVisible;
      applyToGlobe();
    },
    setRings(nextRings: RadarHotspotRing[]) {
      rings = nextRings;
      applyToGlobe();
    },
    dispose() {
      globe.ringsData([]);
    },
  };
}
