/** Escena imperativa estable: la instrumentación no recrea WebGL ni renderiza React por frame. */
import { useEffect, type RefObject } from 'react';
import Globe, { type GlobeInstance } from 'globe.gl';
import type { Points } from 'three';
import { GLOBE_CONFIG } from './globeConfig';
import { createStarField, disposeStarField } from './starField';
import { createSurfaceSelection } from './surfaceSelection';
import { createEarthSurface } from './earthSurface';
import type { EarthSurfaceStatus } from './earthConfig';
import {
  createFocusOffsetController,
  extendCameraFarPlane,
  resolveInitialAltitude,
} from './globeSetup';
export type { GlobeLocation, GlobeSceneApi, ScenePreferences } from '../../types/globe.types';
import type { GlobeLocation, GlobeSceneApi, ScenePreferences } from '../../types/globe.types';

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
      .showAtmosphere(initialPreferences?.atmosphereVisible ?? true)
      .atmosphereColor(GLOBE_CONFIG.atmosphereColor)
      .atmosphereAltitude(GLOBE_CONFIG.atmosphereAltitude)
      .width(container.clientWidth)
      .height(container.clientHeight);

    const disposeSurface = createEarthSurface(globe, container, onSurfaceStatus);
    extendCameraFarPlane(globe);

    const renderer = globe.renderer();
    const disposeSelection = createSurfaceSelection(globe, location => locationSelectHandler?.(location));
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

    const starLayers: Points[] = createStarField(globe.scene());
    const focusOffset = createFocusOffsetController(globe, container);
    if (initialPreferences && !initialPreferences.starsVisible) {
      starLayers.forEach((layer) => {
        layer.visible = false;
      });
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
      apiRef.current = {
        setAutoRotateEnabled: (enabled) => {
          autoRotatePreferred = enabled;
          syncAutoRotate();
        },
        setStarsVisible: (visible) => {
          starLayers.forEach((layer) => {
            layer.visible = visible;
          });
        },
        setGridVisible: (visible) => { globe.showGraticules(visible); },
        setAtmosphereVisible: (visible) => { globe.showAtmosphere(visible); },
        setLocationSelectHandler: (handler) => { locationSelectHandler = handler; },
        inspectCenter: () => {
          const { lat, lng } = globe.pointOfView();
          locationSelectHandler?.({ lat, lng });
        },
        resetCamera: () => {
          cameraOwnedByUser = false;
          moveToInitialPov(reducedMotion.matches ? 0 : GLOBE_CONFIG.resetCameraMs);
        },
        setFocusOffset: (offsetPx, verticalOffsetPx) => focusOffset.set(offsetPx, verticalOffsetPx),
      };
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (apiRef) apiRef.current = null;
      locationSelectHandler = null;
      disposeSelection();
      disposeSurface();
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
