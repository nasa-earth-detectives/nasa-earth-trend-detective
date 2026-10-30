/** Escena imperativa estable: la instrumentación no recrea WebGL ni renderiza React por frame. */
import { useEffect, type RefObject } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';
import type { Object3D } from 'three';
import { GLOBE_CONFIG } from './globeConfig';
import { createStarField, disposeStarField } from './starField';
import { createSurfaceSelection } from './surfaceSelection';
import { createEarthSurface } from './earthSurface';
import { createEarthDetailTiles } from './earthDetailTiles';
import { createEarthObservationLayers } from './earthObservationLayers';
import { createEarthLiveSystem } from './earthLiveSystem';
import { buildGlobeSceneApi } from './globeApiBuilder';
import type { EarthSurfaceStatus } from './earthConfig';
import {
  createFocusOffsetController,
  extendCameraFarPlane,
  resolveInitialAltitude,
} from './globeSetup';
import type { GlobeLocation, GlobeSceneApi, ScenePreferences } from '../../types/globe.types';
export type { GlobeLocation, GlobeSceneApi, ScenePreferences };

export function useGlobeScene(
  containerRef: RefObject<HTMLDivElement | null>,
  apiRef?: RefObject<GlobeSceneApi | null>,
  /** Conserva las preferencias en reconstrucciones de Strict Mode/HMR. */
  preferencesRef?: RefObject<ScenePreferences>,
  onSurfaceStatus?: (status: EarthSurfaceStatus) => void,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const initialPreferences = preferencesRef?.current;
    let locationSelectHandler: ((location: GlobeLocation) => void) | null = null;
    const globe: GlobeInstance = new Globe(container, {
      rendererConfig: { antialias: true, alpha: false },
    });

    globe
      .backgroundColor(GLOBE_CONFIG.backgroundColor)
      .showGlobe(true)
      .showGraticules(initialPreferences?.gridVisible ?? false)
      // La atmósfera propia (earthAtmosphere) reemplaza la genérica, que no conoce el sol.
      .showAtmosphere(false)
      .width(container.clientWidth)
      .height(container.clientHeight);

    const surface = createEarthSurface(globe, container, onSurfaceStatus);
    surface.setAtmosphereVisible(initialPreferences?.atmosphereVisible ?? true);
    extendCameraFarPlane(globe);
    const detailTiles = createEarthDetailTiles(globe, container, surface);

    const renderer = globe.renderer();
    const analysis = createEarthObservationLayers(globe, location => locationSelectHandler?.(location));
    const liveSystem = createEarthLiveSystem(globe, surface.sunDirection);
    const disposeSelection = createSurfaceSelection(globe, location => {
      analysis.select(null);
      locationSelectHandler?.(location);
    }, analysis.pick);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, GLOBE_CONFIG.maxPixelRatio));

    // ─── Controles orbitales ─────────────────────────────────────────────
    const controls = globe.controls();
    controls.enableDamping = true;
    controls.dampingFactor = GLOBE_CONFIG.dampingFactor;
    controls.rotateSpeed = GLOBE_CONFIG.rotateSpeed;
    controls.zoomSpeed = GLOBE_CONFIG.zoomSpeed;
    controls.enablePan = false;
    controls.minDistance = GLOBE_CONFIG.minDistance;
    controls.maxDistance = GLOBE_CONFIG.maxDistance;
    controls.autoRotateSpeed = GLOBE_CONFIG.autoRotateSpeed;

    const moveToInitialPov = (transitionMs: number): void => {
      globe.pointOfView(
        {
          lat: GLOBE_CONFIG.initialLat,
          lng: GLOBE_CONFIG.initialLng,
          altitude: resolveInitialAltitude(container.clientWidth, container.clientHeight),
        },
        transitionMs,
      );
    };
    moveToInitialPov(0);

    const starLayers: Object3D[] = createStarField(globe.scene(), renderer);
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

    // ─── Rotación en reposo ──────────────────────────────────────────────
    let autoRotatePreferred = initialPreferences ? initialPreferences.autoRotate : true;
    let interacting = false;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const syncAutoRotate = (): void => {
      controls.autoRotate = autoRotatePreferred && !interacting;
    };
    syncAutoRotate();

    // Mientras el usuario no mueva la cámara, el encuadre puede recalcularse
    // al cambiar el tamaño del viewport (rotar el móvil, maximizar la ventana).
    let cameraOwnedByUser = false;

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

    // ─── Redimensionado basado en el contenedor, no en la ventana ────────
    const resizeObserver = new ResizeObserver(() => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      globe.width(clientWidth).height(clientHeight);

      const nextPixelRatio = Math.min(window.devicePixelRatio, GLOBE_CONFIG.maxPixelRatio);
      if (renderer.getPixelRatio() !== nextPixelRatio) {
        renderer.setPixelRatio(nextPixelRatio);
      }

      if (!cameraOwnedByUser) moveToInitialPov(0);
      focusOffset.reapply();
    });
    resizeObserver.observe(container);

    if (apiRef) {
      apiRef.current = buildGlobeSceneApi({
        analysis,
        surface,
        liveSystem,
        globe,
        starLayers,
        focusOffset,
        setAutoRotatePreferred: (val) => { autoRotatePreferred = val; },
        syncAutoRotate,
        setCameraOwned: (val) => { cameraOwnedByUser = val; },
        moveToInitialPov,
        reducedMotion,
        getLocationSelectHandler: () => locationSelectHandler,
        setLocationSelectHandler: (handler) => { locationSelectHandler = handler; },
      });
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (apiRef) apiRef.current = null;
      locationSelectHandler = null;
      disposeSelection();
      liveSystem.dispose();
      analysis.dispose();
      detailTiles.dispose();
      surface.dispose();
      focusOffset.dispose();
      resizeObserver.disconnect();
      controls.removeEventListener('start', handleInteractionStart);
      controls.removeEventListener('end', handleInteractionEnd);

      disposeStarField(globe.scene(), starLayers);
      globe._destructor();

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, [containerRef, apiRef, preferencesRef, onSurfaceStatus]);
}
