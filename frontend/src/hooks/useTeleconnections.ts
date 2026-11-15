import { useEffect, type RefObject } from 'react';
import type { GlobeSceneApi } from '../types/globe.types';
import { getTeleconnections } from '../services/teleconnectionService';
import { localizeTeleconnection, useI18n } from '../i18n';

/** Delivers teleconnection arcs to the scene (API pairs + physical processes). */
export function useTeleconnections(sceneApiRef: RefObject<GlobeSceneApi | null>): void {
  const { locale } = useI18n();
  useEffect(() => {
    let active = true;
    void getTeleconnections().then((connections) => {
      if (active) sceneApiRef.current?.setTeleconnections?.(connections.map((item) => localizeTeleconnection(item, locale)));
    });
    return () => { active = false; };
  }, [sceneApiRef, locale]);
}
