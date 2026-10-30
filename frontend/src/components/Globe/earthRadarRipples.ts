import type { GlobeInstance } from 'globe.gl';
import { Color } from 'three';
import type { Teleconnection, TeleconnectionEndpoint } from '../../types/teleconnection.types';

/**
 * Anillos que marcan los extremos de cada teleconexión, del color de su arco. Antes eran cinco
 * "hotspots" fijos con colores propios, desconectados de los arcos; ahora siguen a los datos.
 */
interface RingDatum extends TeleconnectionEndpoint {
  rgb: [number, number, number];
  period: number;
}

export function createEarthRadarRipples(globe: GlobeInstance) {
  let visible = true;
  let rings: RingDatum[] = [];

  const apply = (): void => {
    globe
      .ringsData(visible ? rings : [])
      .ringLat((d: object) => (d as RingDatum).lat)
      .ringLng((d: object) => (d as RingDatum).lng)
      .ringColor((d: object) => {
        const [r, g, b] = (d as RingDatum).rgb;
        return (t: number) => `rgba(${r},${g},${b},${Math.max(0, 1 - t) * 0.85})`;
      })
      .ringMaxRadius(2.8)
      .ringPropagationSpeed(1.1)
      .ringRepeatPeriod((d: object) => (d as RingDatum).period)
      .ringResolution(48);
  };

  return {
    setVisible(nextVisible: boolean): void {
      if (visible === nextVisible) return;
      visible = nextVisible;
      apply();
    },
    setConnections(connections: Teleconnection[]): void {
      rings = connections.flatMap((connection, index) => {
        const color = new Color(connection.color);
        const rgb: [number, number, number] = [Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255)];
        // Periodos distintos para que los anillos no laten todos a la vez.
        return [connection.from, connection.to].map((point, k) => ({ ...point, rgb, period: 1700 + ((index * 2 + k) % 5) * 260 }));
      });
      apply();
    },
    dispose(): void {
      globe.ringsData([]);
    },
  };
}
