/**
 * Fuente de verdad única de las preferencias visuales de la escena.
 *
 * El estado de React manda sobre lo que muestran los interruptores, y el
 * mismo valor viaja por referencia hasta `useGlobeScene`, de modo que si la
 * escena WebGL se reconstruye vuelve a nacer con esas preferencias aplicadas.
 */
import { useCallback, useRef, useState, type RefObject } from 'react';
import type { GlobeSceneApi, ScenePreferences } from '../components/Globe/useGlobeScene';

const DEFAULT_PREFERENCES: ScenePreferences = {
  autoRotate: true,
  starsVisible: true,
  gridVisible: false,
  atmosphereVisible: true,
  teleconnectionArcsVisible: true,
  radarRipplesVisible: true,
  satellitesVisible: true,
  oceanFlowVisible: true,
};

export function useSceneControls(sceneApiRef: RefObject<GlobeSceneApi | null>) {
  const [preferences, setPreferences] = useState<ScenePreferences>(DEFAULT_PREFERENCES);
  const preferencesRef = useRef<ScenePreferences>(DEFAULT_PREFERENCES);

  const updatePreference = useCallback(
    <K extends keyof ScenePreferences>(key: K, value: ScenePreferences[K]) => {
      preferencesRef.current = { ...preferencesRef.current, [key]: value };
      setPreferences(preferencesRef.current);
    },
    [],
  );

  const setAutoRotate = useCallback(
    (value: boolean) => {
      updatePreference('autoRotate', value);
      sceneApiRef.current?.setAutoRotateEnabled(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setStarsVisible = useCallback(
    (value: boolean) => {
      updatePreference('starsVisible', value);
      sceneApiRef.current?.setStarsVisible(value);
    },
    [sceneApiRef, updatePreference],
  );

  const resetCamera = useCallback(() => sceneApiRef.current?.resetCamera(), [sceneApiRef]);

  const setGridVisible = useCallback(
    (value: boolean) => {
      updatePreference('gridVisible', value);
      sceneApiRef.current?.setGridVisible(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setAtmosphereVisible = useCallback(
    (value: boolean) => {
      updatePreference('atmosphereVisible', value);
      sceneApiRef.current?.setAtmosphereVisible(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setTeleconnectionsVisible = useCallback(
    (value: boolean) => {
      updatePreference('teleconnectionArcsVisible', value);
      sceneApiRef.current?.setTeleconnectionArcsVisible?.(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setRadarRipplesVisible = useCallback(
    (value: boolean) => {
      updatePreference('radarRipplesVisible', value);
      sceneApiRef.current?.setRadarRipplesVisible?.(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setSatellitesVisible = useCallback(
    (value: boolean) => {
      updatePreference('satellitesVisible', value);
      sceneApiRef.current?.setSatellitesVisible?.(value);
    },
    [sceneApiRef, updatePreference],
  );

  const setOceanFlowVisible = useCallback(
    (value: boolean) => {
      updatePreference('oceanFlowVisible', value);
      sceneApiRef.current?.setOceanFlowVisible?.(value);
    },
    [sceneApiRef, updatePreference],
  );

  return {
    preferences,
    preferencesRef,
    setAutoRotate,
    setStarsVisible,
    setGridVisible,
    setAtmosphereVisible,
    setTeleconnectionsVisible,
    setRadarRipplesVisible,
    setSatellitesVisible,
    setOceanFlowVisible,
    resetCamera,
  };
}
