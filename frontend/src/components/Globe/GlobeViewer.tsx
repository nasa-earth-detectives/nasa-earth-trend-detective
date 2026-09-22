import { useRef, useState, type RefObject } from 'react';
import { useGlobeScene, type GlobeSceneApi, type ScenePreferences } from './useGlobeScene';
import type { EarthSurfaceStatus } from './earthConfig';

interface GlobeViewerProps {
  /** Permite que los instrumentos actúen sobre la escena ya montada. */
  apiRef?: RefObject<GlobeSceneApi | null>;
  /** Preferencias vigentes, para que una recreación de escena las conserve. */
  preferencesRef?: RefObject<ScenePreferences>;
}

/**
 * Escena geoespacial 3D a pantalla completa (Globe.gl + Three.js).
 *
 * Lienzo de fondo de toda la aplicación. La viñeta y el grano son capas CSS de
 * profundidad y no tocan la arquitectura de la escena. El estado de los datos
 * lo comunica la lectura de sistema, no este componente.
 */
export function GlobeViewer({ apiRef, preferencesRef }: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [surfaceStatus, setSurfaceStatus] = useState<EarthSurfaceStatus>('loading');
  useGlobeScene(containerRef, apiRef, preferencesRef, setSurfaceStatus);

  return (
    <div className="absolute inset-0 scene-vignette scene-grain">
      {/* Globe.gl monta el canvas WebGL dentro de este contenedor. */}
      <div ref={containerRef} className="absolute inset-0" />
      {(surfaceStatus === 'fallback' || surfaceStatus === 'degraded') &&
        <p role="status" className="absolute bottom-2 right-5 text-[11px] text-[color:var(--text-tertiary)] pointer-events-none">
          {surfaceStatus === 'fallback' ? 'Imagen terrestre no disponible · vista provisional' : 'Superficie terrestre · detalle parcial'}
        </p>}
    </div>
  );
}
