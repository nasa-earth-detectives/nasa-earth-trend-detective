/** Two regions linked by a physical process or opposing trends. Rendered by the arcs layer. */
export interface TeleconnectionEndpoint {
  label: string;
  lat: number;
  lng: number;
}

export interface Teleconnection {
  id: string;
  name: string;
  from: TeleconnectionEndpoint;
  to: TeleconnectionEndpoint;
  color: string;
  /** Arc altitude in Earth radii. */
  altitude: number;
  /** 'api' = pair from /api/trends/opposing; 'local' = illustrative physical teleconnection. */
  source: 'api' | 'local';
}
