/**
 * Case studies: a board comparing two regions variable by variable. It is the core idea of the
 * challenge (the same variable rises in one place and falls in another) shown with data, not told.
 */
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { ClimateVariable } from '../../types/climate.types';
import type { SelectedLocation } from '../../hooks/useImmersiveUi';
import { CLIMATE_VARIABLES } from '../../config/climateLayers';
import { CASE_REGIONS, CASE_VARIABLES, caseKey, type CaseRegion } from '../../config/opposingCases';
import { OBSERVATION_SCALES } from '../../utils/colorScales';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useOpposingCases, type CaseVerdict } from '../../hooks/useOpposingCases';
import { verdictTone } from '../../utils/caseVerdict';
import { OpposingCaseCell } from './OpposingCaseCell';
import { VARIABLE_ACCENT_STYLE, VARIABLE_ICONS } from './variableIcons';
import '../../styles/detective-modals.css';

/** What the globe needs to open a case: which variable, where, and in which year. */
export interface MissionPreset {
  variable: ClimateVariable;
  location: SelectedLocation;
  year: number;
}

const coordinates = (region: CaseRegion) =>
  `${Math.abs(region.lat)}° ${region.lat >= 0 ? 'N' : 'S'} · ${Math.abs(region.lng)}° ${region.lng >= 0 ? 'E' : 'W'}`;

/** Pair reading: only called "Opposite" if both trends are significant and have opposite signs. */
function pairReading(first: CaseVerdict | undefined, second: CaseVerdict | undefined): { tone: string; label: string } {
  const tones = [verdictTone(first), verdictTone(second)];
  if (tones.includes('none')) return { tone: 'pending', label: '—' };
  if (tones.includes('flat')) return { tone: 'open', label: 'Inconclusive' };
  return tones[0] === tones[1] ? { tone: 'same', label: 'Same direction' } : { tone: 'opposite', label: 'Opposite' };
}

interface DetectiveMissionsModalProps {
  open: boolean;
  onClose: () => void;
  onSelectMission: (mission: MissionPreset) => void;
}

export function DetectiveMissionsModal({ open, onClose, onSelectMission }: DetectiveMissionsModalProps) {
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
            <p className="dossier__eyebrow">Case studies<span>MERRA-2 · NASA POWER</span></p>
            <h2 id="cases-title">Two regions, opposite directions</h2>
            <p className="dossier__lead">
              The same variable can rise in one place and fall in another. Every figure on this board is computed
              live from that cell’s actual series: none are hardcoded.
            </p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label="Close">
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="case-board scrollbar-instrument">
          <table className="case-board__table">
            <caption className="sr-only">Trends by variable across two regions</caption>
            <thead>
              <tr className="case-board__head">
                <th scope="col">Variable</th>
                {CASE_REGIONS.map(region => (
                  <th key={region.id} scope="col" className="case-board__place">{region.name}<small>{coordinates(region)}</small></th>
                ))}
                <th scope="col">Reading</th>
              </tr>
            </thead>
            <tbody>
              {CASE_VARIABLES.map(variable => {
                const meta = CLIMATE_VARIABLES.find(item => item.id === variable);
                const Icon = VARIABLE_ICONS[variable];
                const [first, second] = CASE_REGIONS.map(region => verdicts[caseKey(variable, region.id)]);
                const reading = pairReading(first, second);
                return (
                  <tr key={variable} className="case-board__row" style={VARIABLE_ACCENT_STYLE[variable]}>
                    <th scope="row">
                      <div className="case-board__variable">
                        <span className="case-board__icon" aria-hidden="true"><Icon size={17} strokeWidth={1.5} /></span>
                        <span>{meta?.name}<small>{OBSERVATION_SCALES[variable].unit}</small></span>
                      </div>
                    </th>
                    {CASE_REGIONS.map((region, index) => (
                      <OpposingCaseCell key={region.id} verdict={index === 0 ? first : second}
                        unit={OBSERVATION_SCALES[variable].unit} placeLabel={`${meta?.name} in ${region.name}`}
                        onOpen={() => openCase(variable, region)} />
                    ))}
                    <td><span className="case-board__reading" data-tone={reading.tone}>{reading.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="dossier__foot">
          Mann-Kendall test and Sen’s slope across all available years, at 95% confidence.
          MERRA-2 is a NASA model that reconstructs the atmosphere from observations, not a direct
          measurement: the board states what its data show, not why it happens.
        </p>
      </div>
    </div>
  );
}
