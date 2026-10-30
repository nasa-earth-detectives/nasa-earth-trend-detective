import { Compass, Search, Sparkles, BookOpen } from 'lucide-react';

interface MissionHeaderProps {
  edition?: string;
  projectName?: string;
  onStartTour?: () => void;
  onOpenWizard?: () => void;
  onOpenMissions?: () => void;
  onOpenGlossary?: () => void;
}

export function MissionHeader({
  edition = 'NASA Space Apps · 2026',
  projectName = 'Trend Detective',
  onStartTour,
  onOpenWizard,
  onOpenMissions,
  onOpenGlossary,
}: MissionHeaderProps) {
  return (
    <header id="tour-mission-header" className="mission-signature" aria-label="Identidad del proyecto">
      <div className="mission-identity">
        <p className="mission-domain">Earth System</p>
        <h1>{projectName}</h1>
        <p className="mission-edition">{edition}</p>
      </div>

      <nav className="mission-actions" aria-label="Acciones del proyecto">
        {onOpenMissions && (
          <button
            type="button"
            onClick={onOpenMissions}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Casos de demostración preconfigurados"
            title="Casos de demostración (NASA Space Apps)"
          >
            <Sparkles size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Casos</span>
          </button>
        )}

        {onOpenGlossary && (
          <button
            type="button"
            onClick={onOpenGlossary}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Glosario escolar"
            title="Glosario para estudiantes y evaluadores"
          >
            <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Glosario</span>
          </button>
        )}

        {onOpenWizard && (
          <button
            type="button"
            onClick={onOpenWizard}
            className="mission-action-btn focus-ring wizard-reopen-btn"
            data-ui-control
            aria-label="Asistente de investigación"
            title="Detective: abrir asistente guiado"
          >
            <Search size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Investigar</span>
          </button>
        )}

        {onStartTour && (
          <button
            id="tour-launch-button"
            type="button"
            onClick={onStartTour}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Iniciar guía de misión"
            title="Guía interactiva"
          >
            <Compass size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Guía</span>
          </button>
        )}
      </nav>
    </header>
  );
}
