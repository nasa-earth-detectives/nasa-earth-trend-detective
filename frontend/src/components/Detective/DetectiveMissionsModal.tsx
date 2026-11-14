/**
 * Casos de estudio: un tablero que compara dos regiones variable por variable. Es la idea central del
 * reto (una misma variable sube en un lugar y baja en otro) enseñada con datos, no contada.
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

/** Lo que el globo necesita para abrir un caso: qué variable, dónde y en qué año. */
export interface MissionPreset {
  variable: ClimateVariable;
  location: SelectedLocation;
  year: number;
}

const coordinates = (region: CaseRegion) =>
  `${Math.abs(region.lat)}° ${region.lat >= 0 ? 'N' : 'S'} · ${Math.abs(region.lng)}° ${region.lng >= 0 ? 'E' : 'O'}`;

/** Lectura del par: sólo se dice "opuestas" si las dos tendencias son significativas y de signo contrario. */
function pairReading(first: CaseVerdict | undefined, second: CaseVerdict | undefined): { tone: string; label: string } {
  const tones = [verdictTone(first), verdictTone(second)];
  if (tones.includes('none')) return { tone: 'pending', label: '—' };
  if (tones.includes('flat')) return { tone: 'open', label: 'No concluyente' };
  return tones[0] === tones[1] ? { tone: 'same', label: 'Mismo sentido' } : { tone: 'opposite', label: 'Opuestas' };
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
            <p className="dossier__eyebrow">Casos de estudio<span>MERRA-2 · NASA POWER</span></p>
            <h2 id="cases-title">Dos regiones, sentidos opuestos</h2>
            <p className="dossier__lead">
              La misma variable puede subir en un lugar y bajar en otro. Cada cifra de este tablero se calcula
              ahora mismo con la serie real de esa celda: ninguna está escrita a mano.
            </p>
          </div>
          <button type="button" onClick={onClose} className="dossier__close focus-ring" aria-label="Cerrar">
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </header>

        <div className="case-board scrollbar-instrument">
          <table className="case-board__table">
            <caption className="sr-only">Tendencias por variable en dos regiones</caption>
            <thead>
              <tr className="case-board__head">
                <th scope="col">Variable</th>
                {CASE_REGIONS.map(region => (
                  <th key={region.id} scope="col" className="case-board__place">{region.name}<small>{coordinates(region)}</small></th>
                ))}
                <th scope="col">Lectura</th>
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
                        unit={OBSERVATION_SCALES[variable].unit} placeLabel={`${meta?.name} en ${region.name}`}
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
          Prueba de Mann-Kendall y pendiente de Sen sobre todos los años disponibles, con 95 % de confianza.
          MERRA-2 es un modelo de la NASA que reconstruye la atmósfera a partir de observaciones, no una
          medición directa: el tablero dice qué muestran sus datos, no por qué ocurre.
        </p>
      </div>
    </div>
  );
}
