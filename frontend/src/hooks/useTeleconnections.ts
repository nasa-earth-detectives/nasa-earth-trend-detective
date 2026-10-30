import { useEffect, type RefObject } from 'react';
import type { GlobeSceneApi } from '../types/globe.types';
import { getTeleconnections } from '../services/teleconnectionService';

/** Entrega a la escena los arcos de teleconexión (pares de la API + procesos físicos). */
export function useTeleconnections(sceneApiRef: RefObject<GlobeSceneApi | null>): void {
  useEffect(() => {
    let active = true;
    void getTeleconnections().then((connections) => {
      if (active) sceneApiRef.current?.setTeleconnections?.(connections);
    });
    return () => { active = false; };
  }, [sceneApiRef]);
}
