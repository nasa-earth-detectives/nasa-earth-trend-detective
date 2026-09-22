import { Compass, Globe2 } from 'lucide-react';

interface MissionHeaderProps {
  edition?: string;
  projectName?: string;
  onStartTour?: () => void;
}

export function MissionHeader({
  edition = 'NASA Space Apps · 2026',
  projectName = 'Trend Detective',
  onStartTour,
}: MissionHeaderProps) {
  return (
    <header id="tour-mission-header" className="mission-signature" aria-label="Insignia de Misión NASA">
}: MissionHeaderProps) {
  return (
    <header className="mission-signature" aria-label="Insignia de Misión NASA">
      <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-cyan-950/40 border border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]">
        <Globe2 className="w-5 h-5 animate-pulse text-cyan-300" aria-hidden="true" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </div>

      <div className="flex flex-col pr-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 font-mono">
            Earth System
          </span>
          <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
          <span className="text-[10px] font-medium tracking-wide text-slate-400">
            {edition}
          </span>
        </div>
        <h1 className="text-base font-bold tracking-tight text-slate-100 leading-tight">
          {projectName}
        </h1>
      </div>

      {onStartTour && (
        <button
          id="tour-launch-button"
          type="button"
          onClick={onStartTour}
          className="mission-tour-trigger-btn ml-2"
          title="Iniciar Recorrido Guiado Interactivo"
          aria-label="Iniciar Recorrido Guiado Interactivo"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-300" />
          <span>Guía de Misión</span>
        </button>
      )}
    </header>
  );
}

