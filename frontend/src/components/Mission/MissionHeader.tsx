import { Compass } from 'lucide-react';

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
    <header id="tour-mission-header" className="mission-signature" aria-label="Identidad del proyecto">
      <div className="mission-identity">
        <p className="mission-domain">Earth System</p>
        <h1>{projectName}</h1>
        <p className="mission-edition">{edition}</p>
      </div>

      {onStartTour && (
        <button
          id="tour-launch-button"
          type="button"
          onClick={onStartTour}
          className="mission-tour-trigger-btn focus-ring"
          data-ui-control
          aria-label="Iniciar guía de misión"
        >
          <Compass size={16} strokeWidth={1.5} aria-hidden="true" />
          <span>Guía<span className="mission-tour-detail"> de misión</span></span>
        </button>
      )}
    </header>
  );
}

