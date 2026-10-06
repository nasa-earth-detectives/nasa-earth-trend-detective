/** Dos regiones ligadas por un proceso físico o por tendencias opuestas. Lo dibuja la capa de arcos. */
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
  /** Altura del arco en radios terrestres. */
  altitude: number;
  /** 'api' = par de /api/trends/opposing; 'local' = teleconexión física ilustrativa. */
  source: 'api' | 'local';
}
