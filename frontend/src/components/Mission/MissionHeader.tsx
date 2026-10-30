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

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        {onOpenMissions && (
          <button
            type="button"
            onClick={onOpenMissions}
            className="mission-tour-trigger-btn focus-ring"
            data-ui-control
            aria-label="Abrir misiones de demostración"
            title="Casos de estudio preconfigurados"
          >
            <Sparkles size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Casos</span>
          </button>
        )}

        {onOpenGlossary && (
          <button
            type="button"
            onClick={onOpenGlossary}
            className="mission-tour-trigger-btn focus-ring"
            data-ui-control
            aria-label="Abrir glosario escolar"
            title="Glosario para estudiantes y público general"
          >
            <BookOpen size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Glosario</span>
          </button>
        )}

        {onOpenWizard && (
          <button
            type="button"
            onClick={onOpenWizard}
            className="mission-tour-trigger-btn focus-ring wizard-reopen-btn"
            data-ui-control
            aria-label="Abrir asistente de investigación"
            title="Detective: volver al asistente"
          >
            <Search size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>Investigar</span>
          </button>
        )}

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
      </div>
    </header>
  );
}
