import type { ClimateObservation, ClimateVariable } from '../../types/climate.types';
import { rasterizeEarthHeat } from './earthHeatRaster';

export interface HeatWorkerRequest {
  id: number;
  observations: ClimateObservation[];
  variable: ClimateVariable;
}
export interface HeatWorkerResponse { id: number; pixels?: Uint8Array; error?: string }

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<HeatWorkerRequest>) => void) | null;
  postMessage(message: HeatWorkerResponse, transfer: Transferable[]): void;
};
scope.onmessage = ({ data }): void => {
  try {
    const pixels = rasterizeEarthHeat(data.observations, data.variable).pixels;
    scope.postMessage({ id: data.id, pixels }, [pixels.buffer]);
  } catch {
    scope.postMessage({ id: data.id, error: 'No fue posible calcular el mapa de observaciones.' }, []);
  }
};
