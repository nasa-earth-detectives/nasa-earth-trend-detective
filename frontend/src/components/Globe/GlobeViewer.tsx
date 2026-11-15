import { useRef, useState, type RefObject } from 'react';
import { useGlobeScene, type GlobeSceneApi, type ScenePreferences } from './useGlobeScene';
import type { EarthSurfaceStatus } from './earthConfig';
import { EARTH_TILE_ATTRIBUTION } from './earthTileConfig';
import { useI18n } from '../../i18n';

interface GlobeViewerProps {
  /** Allows instruments to interact with the mounted scene. */
  apiRef?: RefObject<GlobeSceneApi | null>;
  /** Current preferences, so scene recreation preserves them. */
  preferencesRef?: RefObject<ScenePreferences>;
}

/**
 * Fullscreen 3D geospatial scene (Globe.gl + Three.js).
 *
 * Background canvas for the entire application. Vignette and film grain are CSS
 * depth overlays without touching scene architecture. Data status is reported
 * by system readouts, not this component.
 */
export function GlobeViewer({ apiRef, preferencesRef }: GlobeViewerProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [surfaceStatus, setSurfaceStatus] = useState<EarthSurfaceStatus>('loading');
  useGlobeScene(containerRef, apiRef, preferencesRef, setSurfaceStatus);

  return (
    <div className="group absolute inset-0 scene-vignette scene-grain">
      {/* Globe.gl mounts the WebGL canvas inside this container. */}
      <div ref={containerRef} className="absolute inset-0" />
      {/* Required source attribution; only visible when tiles are on screen. */}
      <p aria-hidden="true" className="absolute bottom-6 right-5 text-[10px] text-[color:var(--text-tertiary)]
        pointer-events-none opacity-0 transition-opacity duration-500
        group-has-[[data-earth-tiles=active]]:opacity-100">
        {EARTH_TILE_ATTRIBUTION}
      </p>
      {(surfaceStatus === 'fallback' || surfaceStatus === 'degraded') &&
        <p role="status" className="absolute bottom-2 right-5 text-[11px] text-[color:var(--text-tertiary)] pointer-events-none">
          {surfaceStatus === 'fallback' ? t.workspace.globeFallback : t.workspace.globeDegraded}
        </p>}
    </div>
  );
}
