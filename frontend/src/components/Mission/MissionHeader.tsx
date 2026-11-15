import { Compass, Search, Scale, BookOpen } from 'lucide-react';
import { useI18n } from '../../i18n';
import { PlaceSearch } from '../Places/PlaceSearch';
import type { Place } from '../../services/placeSearch';

interface MissionHeaderProps {
  edition?: string;
  projectName?: string;
  onStartTour?: () => void;
  onOpenWizard?: () => void;
  onOpenMissions?: () => void;
  onOpenGlossary?: () => void;
  /** A place was chosen in the search box. */
  onPlaceSelect?: (place: Place) => void;
}

export function MissionHeader({
  edition,
  projectName,
  onStartTour,
  onOpenWizard,
  onOpenMissions,
  onOpenGlossary,
  onPlaceSelect,
}: MissionHeaderProps) {
  const { locale, setLocale, t } = useI18n();
  const displayName = projectName ?? t.header.projectName;
  const displayEdition = edition ?? t.header.edition;

  return (
    <header id="tour-mission-header" className="mission-signature" aria-label={t.header.projectIdentityAria}>
      <div className="mission-identity">
        <p className="mission-domain">{t.header.domain}</p>
        <h1>{displayName}</h1>
        <p className="mission-edition">{displayEdition}</p>
      </div>

      <nav className="mission-actions" aria-label={t.header.actionsAria}>
        {onOpenMissions && (
          <button
            id="tour-cases-button"
            type="button"
            onClick={onOpenMissions}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label={t.header.casesAria}
            title={t.header.casesTitle}
          >
            <Scale size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">{t.header.casesLabel}</span>
          </button>
        )}

        {onOpenGlossary && (
          <button
            id="tour-glossary-button"
            type="button"
            onClick={onOpenGlossary}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label={t.header.glossaryAria}
            title={t.header.glossaryTitle}
          >
            <BookOpen size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">{t.header.glossaryLabel}</span>
          </button>
        )}

        {onOpenWizard && (
          <button
            id="tour-investigate-button"
            type="button"
            onClick={onOpenWizard}
            className="mission-action-btn focus-ring wizard-reopen-btn"
            data-ui-control
            aria-label={t.header.investigateAria}
            title={t.header.investigateTitle}
          >
            <Search size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">{t.header.investigateLabel}</span>
          </button>
        )}

        {onStartTour && (
          <button
            id="tour-launch-button"
            type="button"
            onClick={onStartTour}
            className="mission-action-btn focus-ring"
            data-ui-control
            aria-label={t.header.tourAria}
            title={t.header.tourTitle}
          >
            <Compass size={14} strokeWidth={1.8} aria-hidden="true" />
            <span className="mission-btn-text">{t.header.tourLabel}</span>
          </button>
        )}

        <div id="tour-lang-switch" className="mission-lang-switch" role="group" aria-label={t.header.langGroupAria} data-ui-control>
          <button
            type="button"
            className="mission-lang-btn focus-ring"
            aria-pressed={locale === 'en'}
            aria-label={t.header.langEnAria}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className="mission-lang-btn focus-ring"
            aria-pressed={locale === 'es'}
            aria-label={t.header.langEsAria}
            onClick={() => setLocale('es')}
          >
            ES
          </button>
        </div>
      </nav>
      {onPlaceSelect && <PlaceSearch onSelect={onPlaceSelect} />}
    </header>
  );
}
