import { Compass, Search, Scale, BookOpen } from 'lucide-react';

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
    <header id="tour-mission-header" className="mission-signature" aria-label="Project identity">
      <div className="mission-identity">
        <p className="mission-domain">Earth System</p>
        <h1>{projectName}</h1>
        <p className="mission-edition">{edition}</p>
      </div>

      <nav className="mission-actions" aria-label="Project actions">
        {onOpenMissions && (
          <button
            type="button"
            onClick={onOpenMissions}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Case studies with opposing trends"
            title="Case studies: two regions, opposite directions"
          >
            <Scale size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Cases</span>
          </button>
        )}

        {onOpenGlossary && (
          <button
            type="button"
            onClick={onOpenGlossary}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Student glossary"
            title="Glossary for students and reviewers"
          >
            <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Glossary</span>
          </button>
        )}

        {onOpenWizard && (
          <button
            type="button"
            onClick={onOpenWizard}
            className="mission-action-btn focus-ring wizard-reopen-btn"
            data-ui-control
            aria-label="Investigation wizard"
            title="Detective: open guided wizard"
          >
            <Search size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Investigate</span>
          </button>
        )}

        {onStartTour && (
          <button
            id="tour-launch-button"
            type="button"
            onClick={onStartTour}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label="Start mission tour"
            title="Interactive guide"
          >
            <Compass size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">Tour</span>
          </button>
        )}
      </nav>
    </header>
  );
}
