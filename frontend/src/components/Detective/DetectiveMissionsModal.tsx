/**
 * Case studies: a board comparing two regions variable by variable. This is the core idea of the
 * challenge (the same variable rises in one place and falls in another) shown with data, not told.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import { CASE_REGIONS, CASE_VARIABLES, caseKey, type CaseRegion } from '../../config/opposingCases';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOpposingCases, type CaseVerdict } from '../../hooks/useOpposingCases';
import { verdictTone } from '../../utils/caseVerdict';
import { OpposingCaseCell } from './OpposingCaseCell';
import { VARIABLE_ACCENT_STYLE, VARIABLE_ICONS } from './variableIcons';
import { formatCoordinatesPair, formatTemplate, useI18n, type Translations } from '../../i18n';
import '../../styles/detective-modals.css';

/** What the globe needs to open a case: which variable, where, and in which year. */
export interface MissionPreset {
  variable: ClimateVariable;
  location: SelectedLocation;
  year: number;
}

/** Pair reading: only called "Opposing" if both trends are significant and have opposite signs. */
function pairReading(
  first: CaseVerdict | undefined,
  second: CaseVerdict | undefined,
  modals: Translations['modals'],
): { tone: string; label: string } {
  const tones = [verdictTone(first), verdictTone(second)];
  if (tones.includes('none')) return { tone: 'pending', label: '—' };
  if (tones.includes('flat')) return { tone: 'open', label: modals.casesInconclusive };
  return tones[0] === tones[1]
    ? { tone: 'same', label: modals.casesSameDirection }
    : { tone: 'opposite', label: modals.casesOpposing };
}

interface DetectiveMissionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMission: (mission: MissionPreset) => void;
}

export function DetectiveMissionsModal({ open, onClose, onSelectMission }: DetectiveMissionsModalProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDivElement>(null);
  const verdicts = useOpposingCases(open);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const openCase = (variable: ClimateVariable, region: CaseRegion) => {
    const verdict = verdicts[caseKey(variable, region.id)];
    if (verdict?.status !== 'ready') return;
    onSelectMission({ variable, location: { lat: region.lat, lng: region.lng }, year: verdict.endYear });
    onClose();
  };

  return (
    <div className="dossier-backdrop" onClick={onClose}>
      <div className="dossier dossier--wide" role="dialog" aria-modal="true" aria-labelledby="cases-title"
        ref={dialogRef} tabIndex={-1} onClick={event => event.stopPropagation()}>
        <header className="dossier__header">
          <div>
            <p className="dossier__eyebrow">{t.modals.casesEyebrow}<span>MERRA-2 · NASA POWER</span></p>
            <h2 id="cases-title">{t.modals.casesTitle}</h2>
            <p className="dossier__lead">{t.modals.casesLead}</p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label={t.modals.closeAria}>
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="case-board scrollbar-instrument">
          <table className="case-board__table">
            <caption className="sr-only">{t.modals.casesCaption}</caption>
            <thead>
              <tr className="case-board__head">
                <th scope="col">{t.modals.casesColVariable}</th>
                {CASE_REGIONS.map(region => (
                  <th key={region.id} scope="col" className="case-board__place">
                    {t.caseRegions[region.id] ?? region.name}
                    <small>{formatCoordinatesPair(region.lat, region.lng, 0, t.readouts.compass)}</small>
                  </th>
                ))}
                <th scope="col">{t.modals.casesColReading}</th>
              </tr>
            </thead>
            <tbody>
              {CASE_VARIABLES.map(variable => {
                const variableName = t.variables[variable]?.name ?? variable;
                const unit = t.scales[variable].unit;
                const Icon = VARIABLE_ICONS[variable];
                const [first, second] = CASE_REGIONS.map(region => verdicts[caseKey(variable, region.id)]);
                const reading = pairReading(first, second, t.modals);
                return (
                  <tr key={variable} className="case-board__row" style={VARIABLE_ACCENT_STYLE[variable]}>
                    <th scope="row">
                      <div className="case-board__variable">
                        <span className="case-board__icon" aria-hidden="true"><Icon size={17} strokeWidth={1.5} /></span>
                        <span>{variableName}<small>{unit}</small></span>
                      </div>
                    </th>
                    {CASE_REGIONS.map((region, index) => {
                      const regionName = t.caseRegions[region.id] ?? region.name;
                      const placeLabel = formatTemplate(t.modals.casesPlaceConnector, {
                        variable: variableName,
                        region: regionName,
                      });
                      return (
                        <OpposingCaseCell key={region.id} verdict={index === 0 ? first : second}
                          unit={unit} placeLabel={placeLabel}
                          onOpen={() => openCase(variable, region)} />
                      );
                    })}
                    <td><span className="case-board__reading" data-tone={reading.tone}>{reading.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="dossier__foot">{t.modals.casesFootnote}</p>
      </div>
    </div>
  );
}
