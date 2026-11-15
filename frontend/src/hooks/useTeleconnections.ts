import { useEffect, type RefObject } from 'react';
import type { GlobeSceneApi } from '../types/globe.types';
import { getTeleconnections } from '../services/teleconnectionService';

/** Delivers teleconnection arcs to the scene (API pairs + physical processes). */
export function useTeleconnections(sceneApiRef: RefObject<GlobeSceneApi | null>): void {
  useEffect(() => {
    let active = true;
    void getTeleconnections().then((connections) => {
      if (active) sceneApiRef.current?.setTeleconnections?.(connections);
    });
    return () => { active = false; };
  }, [sceneApiRef]);
}
