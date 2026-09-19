import { useEffect, useRef } from 'react';
import { ClimateObservation } from '../../types/climate.types';

interface GlobeViewerProps {
  observations: ClimateObservation[];
  loading: boolean;
}

export function GlobeViewer({ observations, loading }: GlobeViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Espacio reservado para Diego Arias (Sprint 2 - Three.js / Globe.gl WebGL Canvas)
    // Permite montar el canvas WebGL en containerRef.current
  }, [observations]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[480px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden flex items-center justify-center shadow-2xl"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-950/30 via-slate-950/80 to-slate-950 pointer-events-none" />

      {loading && (
        <div className="absolute z-20 flex flex-col items-center gap-2 bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-800 backdrop-blur">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-300">Cargando observaciones satelitales...</span>
        </div>
      )}

      {/* Visualización conceptual 3D / Fallback geoespacial */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 max-w-md">
        <div className="w-32 h-32 rounded-full border border-cyan-500/30 bg-gradient-to-tr from-cyan-950/40 via-blue-900/30 to-indigo-900/40 shadow-[0_0_50px_rgba(6,182,212,0.15)] flex items-center justify-center mb-4 relative">
          <div className="w-24 h-24 rounded-full border border-cyan-400/40 animate-pulse" />
          <span className="absolute text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            3D
          </span>
        </div>
        <p className="text-sm font-medium text-slate-200">
          Visualizador Geoespacial WebGL / Three.js
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {observations.length > 0
            ? `${observations.length} celdas biofísicas procesadas para renderizado 3D`
            : 'Listo para recibir capas de datos satelitales'}
        </p>
      </div>
    </div>
  );
}
