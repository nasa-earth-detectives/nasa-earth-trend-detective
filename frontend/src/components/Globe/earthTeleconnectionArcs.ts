import type { GlobeInstance } from 'globe.gl';
import { Color } from 'three';
import type { Teleconnection, TeleconnectionEndpoint } from '../../types/teleconnection.types';

/**
 * Arcos finos y continuos entre regiones conectadas, con degradado del origen (tenue) al destino
 * (pleno) y un punto en cada extremo. Sin guiones ni pulsos: cortados, parecían líneas rotas.
 * Los datos llegan de la API (/api/trends/opposing) más dos procesos físicos ilustrativos.
 */
interface ArcDatum {
  connection: Teleconnection;
}

interface EndpointDatum extends TeleconnectionEndpoint {
  color: string;
}

function rgba(hex: string, alpha: number): string {
  const color = new Color(hex);
  return `rgba(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)},${alpha})`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

export function createEarthTeleconnectionArcs(globe: GlobeInstance) {
  let visible = true;
  let connections: Teleconnection[] = [];

  const apply = (): void => {
    const shown = visible ? connections : [];
    const arcs: ArcDatum[] = shown.map((connection) => ({ connection }));
    const endpoints: EndpointDatum[] = shown.flatMap((c) => [{ ...c.from, color: c.color }, { ...c.to, color: c.color }]);
    globe
      .arcsTransitionDuration(0)
      .arcsData(arcs)
      .arcStartLat((d: object) => (d as ArcDatum).connection.from.lat)
      .arcStartLng((d: object) => (d as ArcDatum).connection.from.lng)
      .arcEndLat((d: object) => (d as ArcDatum).connection.to.lat)
      .arcEndLng((d: object) => (d as ArcDatum).connection.to.lng)
      .arcAltitude((d: object) => (d as ArcDatum).connection.altitude)
      .arcColor((d: object) => {
        const { connection } = d as ArcDatum;
        return [rgba(connection.color, 0.35), rgba(connection.color, 1)];
      })
      .arcStroke(0.22)
      .arcDashLength(1)
      .arcDashGap(0)
      .arcDashInitialGap(0)
      .arcDashAnimateTime(0)
      .arcCurveResolution(96)
      .arcLabel((d: object) => {
        const { connection } = d as ArcDatum;
        const note = connection.source === 'local' ? '<br/><i>Proceso físico · ilustrativo</i>' : '';
        return `<b>${escapeHtml(connection.name)}</b><br/>${escapeHtml(connection.from.label)} → ${escapeHtml(connection.to.label)}${note}`;
      })
      .pointsMerge(false)
      .pointsData(endpoints)
      .pointLat((d: object) => (d as EndpointDatum).lat)
      .pointLng((d: object) => (d as EndpointDatum).lng)
      .pointColor((d: object) => (d as EndpointDatum).color)
      .pointAltitude(0.004)
      .pointRadius(0.32);
  };

  return {
    setVisible(nextVisible: boolean): void {
      if (visible === nextVisible) return;
      visible = nextVisible;
      apply();
    },
    setConnections(next: Teleconnection[]): void {
      connections = next;
      apply();
    },
    dispose(): void {
      globe.arcsData([]).pointsData([]);
    },
  };
}
