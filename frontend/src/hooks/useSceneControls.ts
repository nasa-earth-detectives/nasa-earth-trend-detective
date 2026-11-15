/**
 * Single source of truth for scene visual preferences.
 *
 * React state controls what the toggles display, and the
 * same value is passed by reference to `useGlobeScene`, so that if the
 * WebGL scene is rebuilt, it is recreated with those preferences applied.
 */
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { GlobeSceneApi, ScenePreferences } from '../components/Globe/useGlobeScene';
import { getRenderQuality, subscribeRenderQuality } from '../components/Globe/renderQuality';

/** What the lite profile switches off: effects that redraw the whole screen or animate without pause. */
const LITE_OVERRIDES = { atmosphereVisible: false, radarRipplesVisible: false, satellitesVisible: false };
/** The same switches as they come in the full profile, for a page that started in lite. */
const FULL_DEFAULTS: typeof LITE_OVERRIDES = { atmosphereVisible: true, radarRipplesVisible: true, satellitesVisible: true };

const DEFAULT_PREFERENCES: ScenePreferences = {
  // Disabled by default to allow calm cell inspection; can be enabled in View settings if desired.
  autoRotate: false,
  starsVisible: true,
  gridVisible: false,
  teleconnectionArcsVisible: true,
  ...FULL_DEFAULTS,
  // Disabled initially: dashes crossing the oceans cluttered the view.
  oceanFlowVisible: false,
  ...(getRenderQuality().quality === 'lite' ? LITE_OVERRIDES : {}),
};

export function useSceneControls(sceneApiRef: RefObject<GlobeSceneApi | null>) {
  const [preferences, setPreferences] = useState<ScenePreferences>(DEFAULT_PREFERENCES);
  const preferencesRef = useRef<ScenePreferences>(DEFAULT_PREFERENCES);

  // The profile can change during the visit (chosen by hand, or lowered because frames were slow).
  // The scene is rebuilt from preferencesRef, so the switches have to be in place before that.
  const beforeLiteRef = useRef<typeof LITE_OVERRIDES | null>(null);
  useEffect(() => subscribeRenderQuality(() => {
    const current = preferencesRef.current;
    if (getRenderQuality().quality === 'lite') {
      beforeLiteRef.current = { atmosphereVisible: current.atmosphereVisible,
        radarRipplesVisible: current.radarRipplesVisible ?? true, satellitesVisible: current.satellitesVisible ?? true };
      preferencesRef.current = { ...current, ...LITE_OVERRIDES };
    } else {
      // Back to full: what lite switched off returns as it was (factory values if the page started in lite).
      preferencesRef.current = { ...current, ...(beforeLiteRef.current ?? FULL_DEFAULTS) };
      beforeLiteRef.current = null;
    }
    setPreferences(preferencesRef.current);
  }), []);

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
