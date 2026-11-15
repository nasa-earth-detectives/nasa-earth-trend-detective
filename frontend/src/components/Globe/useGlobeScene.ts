/** Stable imperative scene: instrumentation does not recreate WebGL or trigger React re-renders per frame. */
import { useEffect, useRef, type RefObject } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';
import type { Object3D } from 'three';
import { GLOBE_CONFIG } from './globeConfig';
import { createStarField, disposeStarField } from './starField';
import { createSurfaceSelection } from './surfaceSelection';
import { createEarthSurface } from './earthSurface';
import { createEarthDetailTiles } from './earthDetailTiles';
import { createEarthObservationLayers } from './earthObservationLayers';
import { createEarthLiveSystem } from './earthLiveSystem';
import { createEarthUserLocation } from './earthUserLocation';
import { buildGlobeSceneApi } from './globeApiBuilder';
import type { EarthSurfaceStatus } from './earthConfig';
import { createFocusOffsetController, extendCameraFarPlane, resolveInitialAltitude } from './globeSetup';
import { createFrameGovernor } from './frameGovernor';
import { QUALITY_PROFILES, getRenderQuality, setRenderQuality, type RenderQuality } from './renderQuality';
import type { GlobeLocation, GlobeSceneApi, ScenePreferences } from '../../types/globe.types';
export type { GlobeLocation, GlobeSceneApi, ScenePreferences };

/** Data and handlers the page pushes in. Visibility switches are left out: the scene reads those from the preferences. */
const REMEMBERED_CALL = /^set(?!.*Visible$|AutoRotateEnabled$)/;
type SceneCall = (...args: unknown[]) => unknown;
interface SceneMemory { calls: Map<string, unknown[]>; pov: { lat: number; lng: number; altitude: number } | null }

export function useGlobeScene(
  containerRef: RefObject<HTMLDivElement | null>,
  apiRef?: RefObject<GlobeSceneApi | null>,
  preferencesRef?: RefObject<ScenePreferences>,
  onSurfaceStatus?: (status: EarthSurfaceStatus) => void,
  quality: RenderQuality = 'full',
): void {
  // The page only sends data when it changes, and a change of quality profile builds a new scene:
  // without this memory the rebuilt globe would come up empty and back at the starting view.
  const memoryRef = useRef<SceneMemory>({ calls: new Map(), pov: null });
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const initialPreferences = preferencesRef?.current;
    const memory = memoryRef.current;
    let locationSelectHandler: ((location: GlobeLocation) => void) | null = null;
    const profile = QUALITY_PROFILES[quality];
    // Assigned once the governor exists: a texture that arrives late must be drawn even if the scene is idle.
    let wakeScene = (): void => {};
    const globe: GlobeInstance = new Globe(container, {
      rendererConfig: { antialias: profile.antialias, alpha: false, powerPreference: 'high-performance' },
    });

    globe
      .backgroundColor(GLOBE_CONFIG.backgroundColor)
      .showGlobe(true)
      .showGraticules(initialPreferences?.gridVisible ?? false)
      .showAtmosphere(false)
      .width(container.clientWidth)
      .height(container.clientHeight);

    const surface = createEarthSurface(globe, container, status => { wakeScene(); onSurfaceStatus?.(status); },
      { surfaceDetail: profile.surfaceDetail, clouds: profile.clouds, onTexture: () => wakeScene() });
    surface.setAtmosphereVisible(initialPreferences?.atmosphereVisible ?? true);
    extendCameraFarPlane(globe);
    const detailTiles = profile.detailTiles ? createEarthDetailTiles(globe, container, surface) : { dispose(): void {} };

    const renderer = globe.renderer();
    const analysis = createEarthObservationLayers(globe, location => locationSelectHandler?.(location), () => wakeScene());
    const liveSystem = createEarthLiveSystem(globe, surface.sunDirection,
      { celestial: profile.celestial, satellites: profile.satellites });
    const userLocation = createEarthUserLocation(globe.scene());
    const disposeSelection = createSurfaceSelection(globe, location => {
      analysis.select(null);
      locationSelectHandler?.(location);
    }, analysis.pick);

    // Orbit controls
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = GLOBE_CONFIG.dampingFactor;
    controls.rotateSpeed = GLOBE_CONFIG.rotateSpeed;
    controls.zoomSpeed = GLOBE_CONFIG.zoomSpeed;
    controls.enablePan = false;
    controls.minDistance = GLOBE_CONFIG.minDistance;
    controls.maxDistance = GLOBE_CONFIG.maxDistance;
    controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed;

    const governor = createFrameGovernor(globe, renderer, container, {
      basePixelRatio: () => Math.min(window.devicePixelRatio, GLOBE_CONFIG.maxPixelRatio, profile.maxPixelRatio),
      manage: profile.frameGovernor,
      isAnimating: () => controls.autoRotate,
      // A machine judged capable that cannot keep up: rebuild the scene in the lite profile.
      onTooSlow: () => { if (getRenderQuality().reason !== 'manual') setRenderQuality('lite', 'slow-frames'); },
    });
    wakeScene = governor.wake;

    const moveToInitialPov = (transitionMs: number): void => {
      globe.pointOfView({
        lat: GLOBE_CONFIG.initialLat, lng: GLOBE_CONFIG.initialLng,
        altitude: resolveInitialAltitude(container.clientWidth, container.clientHeight),
      }, transitionMs);
    };
    moveToInitialPov(0);
    if (memory.pov) globe.pointOfView(memory.pov, 0);

    const starLayers: Object3D[] = createStarField(globe.scene(), renderer, profile.celestial);
    const focusOffset = createFocusOffsetController(globe, container);
    if (initialPreferences && !initialPreferences.starsVisible) {
      starLayers.forEach((layer) => { layer.visible = false; });
      liveSystem.setSunVisible(false);
    }
    if (initialPreferences) {
      if (initialPreferences.teleconnectionArcsVisible !== undefined) liveSystem.setArcsVisible(initialPreferences.teleconnectionArcsVisible);
      if (initialPreferences.radarRipplesVisible !== undefined) liveSystem.setRipplesVisible(initialPreferences.radarRipplesVisible);
      if (initialPreferences.satellitesVisible !== undefined) liveSystem.setSatellitesVisible(initialPreferences.satellitesVisible);
      if (initialPreferences.oceanFlowVisible !== undefined) liveSystem.setOceanFlowVisible(initialPreferences.oceanFlowVisible);
    }

    let autoRotatePreferred = initialPreferences ? initialPreferences.autoRotate : false;
    let interacting = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;
    const syncAutoRotate = (): void => { controls.autoRotate = autoRotatePreferred && !interacting; };
    syncAutoRotate();

    let cameraOwnedByUser = memory.pov !== null;
    const handleInteractionStart = (): void => {
      if (idleTimer) clearTimeout(idleTimer);
      interacting = true;
      cameraOwnedByUser = true;
      syncAutoRotate();
    };
    const handleInteractionEnd = (): void => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        interacting = false;
        syncAutoRotate();
      }, GLOBE_CONFIG.idleResumeMs);
    };
    controls.addEventListener('start', handleInteractionStart);
    controls.addEventListener('end', handleInteractionEnd);

    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      globe.width(clientWidth).height(clientHeight);
      governor.applyPixelRatio();
      governor.wake();
      if (!cameraOwnedByUser) moveToInitialPov(0);
      focusOffset.reapply();
    });
    resizeObserver.observe(container);

    if (apiRef) {
      const sceneApi = buildGlobeSceneApi({
        analysis, surface, liveSystem, userLocation, globe, starLayers, focusOffset,
        setAutoRotatePreferred: (val) => { autoRotatePreferred = val; },
        syncAutoRotate,
        setCameraOwned: (val) => { cameraOwnedByUser = val; },
        moveToInitialPov, reducedMotion,
        getLocationSelectHandler: () => locationSelectHandler,
        setLocationSelectHandler: (handler) => { locationSelectHandler = handler; },
      });
      // Every call into the scene (new data, a camera move, a toggle) changes what is on screen: wake it first.
      apiRef.current = new Proxy(sceneApi, {
        get(target, key, receiver) {
          const value: unknown = Reflect.get(target, key, receiver);
          if (typeof value !== 'function') return value;
          return (...args: unknown[]): unknown => {
            governor.wake();
            if (typeof key === 'string' && REMEMBERED_CALL.test(key)) { memory.calls.delete(key); memory.calls.set(key, args); }
            return (value as SceneCall).apply(target, args);
          };
        },
      });
      memory.calls.forEach((args, key) => {
        const method: unknown = Reflect.get(sceneApi, key);
        if (typeof method === 'function') (method as SceneCall).apply(sceneApi, args);
      });
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (apiRef) apiRef.current = null;
      // Only a view the visitor chose is worth keeping; otherwise the next scene frames itself.
      memory.pov = cameraOwnedByUser ? globe.pointOfView() : null;
      locationSelectHandler = null;
      disposeSelection();
      userLocation.dispose();
      liveSystem.dispose();
      analysis.dispose();
      detailTiles.dispose();
      surface.dispose();
      focusOffset.dispose();
      governor.dispose();
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleInteractionStart);
      controls.removeEventListener('end', handleInteractionEnd);
      disposeStarField(globe.scene(), starLayers);
      globe._destructor();
      while (container.firstChild) container.removeChild(container.firstChild);
    };
  }, [containerRef, apiRef, preferencesRef, onSurfaceStatus, quality]);
}
