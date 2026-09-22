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
};

export function useSceneControls(sceneApiRef: RefObject<GlobeSceneApi | null>) {
  const [preferences, setPreferences] = useState<ScenePreferences>(DEFAULT_PREFERENCES);
  const preferencesRef = useRef<ScenePreferences>(DEFAULT_PREFERENCES);

  const setAutoRotate = useCallback(
    (value: boolean) => {
      preferencesRef.current = { ...preferencesRef.current, autoRotate: value };
      setPreferences(preferencesRef.current);
      sceneApiRef.current?.setAutoRotateEnabled(value);
    },
    [sceneApiRef],
  );

  const setStarsVisible = useCallback(
    (value: boolean) => {
      preferencesRef.current = { ...preferencesRef.current, starsVisible: value };
      setPreferences(preferencesRef.current);
      sceneApiRef.current?.setStarsVisible(value);
    },
    [sceneApiRef],
  );

  const resetCamera = useCallback(() => sceneApiRef.current?.resetCamera(), [sceneApiRef]);

  const setGridVisible = useCallback(
    (value: boolean) => {
      preferencesRef.current = { ...preferencesRef.current, gridVisible: value };
      setPreferences(preferencesRef.current);
      sceneApiRef.current?.setGridVisible(value);
    },
    [sceneApiRef],
  );

  const setAtmosphereVisible = useCallback(
    (value: boolean) => {
      preferencesRef.current = { ...preferencesRef.current, atmosphereVisible: value };
      setPreferences(preferencesRef.current);
      sceneApiRef.current?.setAtmosphereVisible(value);
    },
    [sceneApiRef],
  );

  return { preferences, preferencesRef, setAutoRotate, setStarsVisible, setGridVisible, setAtmosphereVisible, resetCamera };
}
